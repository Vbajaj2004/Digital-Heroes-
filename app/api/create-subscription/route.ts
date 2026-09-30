import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const PLAN_IDS = {
  monthly: process.env.RAZORPAY_MONTHLY_PLAN_ID,
  yearly: process.env.RAZORPAY_YEARLY_PLAN_ID,
} as const;

export async function POST(request: Request) {
  try {
    // Read the selected plan from the browser
    const body = await request.json();
    const plan = body.plan as "monthly" | "yearly";

    // Validate the plan
    if (plan !== "monthly" && plan !== "yearly") {
      return NextResponse.json(
        {
          error: "Invalid subscription plan.",
        },
        {
          status: 400,
        }
      );
    }

    // Get Razorpay environment variables
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
    const planId = PLAN_IDS[plan];

    if (!razorpayKeyId) {
      return NextResponse.json(
        {
          error: "RAZORPAY_KEY_ID is missing.",
        },
        {
          status: 500,
        }
      );
    }

    if (!razorpayKeySecret) {
      return NextResponse.json(
        {
          error: "RAZORPAY_KEY_SECRET is missing.",
        },
        {
          status: 500,
        }
      );
    }

    if (!planId) {
      return NextResponse.json(
        {
          error: `Razorpay ${plan} plan ID is missing.`,
        },
        {
          status: 500,
        }
      );
    }

    // Create Supabase server client
    const supabase = await createClient();

    // Make sure the user is logged in
    const {
      data: authData,
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return NextResponse.json(
        {
          error: "You must be logged in.",
        },
        {
          status: 401,
        }
      );
    }

    const user = authData.user;

    // Create Basic Authentication for Razorpay
    const basicAuth = Buffer.from(
      `${razorpayKeyId}:${razorpayKeySecret}`
    ).toString("base64");

    // Create subscription in Razorpay
    const razorpayResponse = await fetch(
      "https://api.razorpay.com/v1/subscriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan_id: planId,

          // Demo/test subscription duration
          total_count: plan === "monthly" ? 120 : 10,

          quantity: 1,

          // Razorpay can notify the customer about the subscription
          customer_notify: 1,

          notes: {
            user_id: user.id,
            plan: plan,
          },
        }),
      }
    );

    const razorpayData = await razorpayResponse.json();

    // Handle Razorpay error
    if (!razorpayResponse.ok) {
      console.error(
        "Razorpay subscription creation error:",
        razorpayData
      );

      return NextResponse.json(
        {
          error:
            razorpayData?.error?.description ||
            "Unable to create Razorpay subscription.",
        },
        {
          status: 400,
        }
      );
    }

    // Check if the user already has a subscription row
    const {
      data: existingSubscription,
      error: existingSubscriptionError,
    } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (existingSubscriptionError) {
      console.error(
        "Subscription lookup error:",
        existingSubscriptionError
      );

      return NextResponse.json(
        {
          error: "Unable to access your subscription record.",
        },
        {
          status: 500,
        }
      );
    }

    // Data that we store in Supabase
    const subscriptionData = {
      plan: plan,
      status: "inactive",
      renewal_date: null,
      razorpay_subscription_id: razorpayData.id,
      razorpay_payment_id: null,
      payment_verified_at: null,
      gateway: "razorpay",
    };

    let databaseError = null;

    // Update existing subscription
    if (existingSubscription) {
      const { error } = await supabase
        .from("subscriptions")
        .update(subscriptionData)
        .eq("id", existingSubscription.id)
        .eq("user_id", user.id);

      databaseError = error;
    } else {
      // Create new subscription
      const { error } = await supabase
        .from("subscriptions")
        .insert({
          user_id: user.id,
          ...subscriptionData,
        });

      databaseError = error;
    }

    // Handle database error
    if (databaseError) {
      console.error(
        "Subscription database error:",
        databaseError
      );

      return NextResponse.json(
        {
          error:
            "Razorpay subscription was created, but it could not be saved in the database.",
        },
        {
          status: 500,
        }
      );
    }

    // Send the required information back to the browser
    return NextResponse.json({
      success: true,
      subscriptionId: razorpayData.id,
      keyId: razorpayKeyId,
      plan: plan,
      email: user.email ?? "",
    });
  } catch (error) {
    console.error(
      "Create subscription error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while creating the subscription.",
      },
      {
        status: 500,
      }
    );
  }
}