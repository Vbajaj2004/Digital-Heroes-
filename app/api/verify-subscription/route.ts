import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { createClient } from "@/lib/supabase/server";

type RazorpayPaymentResponse = {
  razorpay_payment_id?: string;
  razorpay_subscription_id?: string;
  razorpay_signature?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RazorpayPaymentResponse;

    const {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
    } = body;

    // Check that Razorpay returned all required values.
    if (
      !razorpay_payment_id ||
      !razorpay_subscription_id ||
      !razorpay_signature
    ) {
      return NextResponse.json(
        { error: "Missing Razorpay payment details." },
        { status: 400 }
      );
    }

    // Secret stays on the server.
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpaySecret) {
      return NextResponse.json(
        { error: "RAZORPAY_KEY_SECRET is missing." },
        { status: 500 }
      );
    }

    // Get the logged-in user.
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    // Razorpay subscription signature:
    // HMAC-SHA256(payment_id + "|" + subscription_id, secret)
    const expectedSignature = createHmac(
      "sha256",
      razorpaySecret
    )
      .update(
        `${razorpay_payment_id}|${razorpay_subscription_id}`
      )
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: "Payment verification failed." },
        { status: 400 }
      );
    }

    // Find the subscription created before checkout.
    const { data: subscription, error: lookupError } =
      await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .eq(
          "razorpay_subscription_id",
          razorpay_subscription_id
        )
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (lookupError) {
      console.error("Subscription lookup error:", lookupError);

      return NextResponse.json(
        { error: "Unable to find your subscription record." },
        { status: 500 }
      );
    }

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription record not found." },
        { status: 404 }
      );
    }

    // Activate the subscription.
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        status: "active",
        razorpay_payment_id,
        payment_verified_at: new Date().toISOString(),
      })
      .eq("id", subscription.id)
      .eq("user_id", user.id);

    if (updateError) {
      console.error(
        "Subscription update error:",
        updateError
      );

      return NextResponse.json(
        {
          error:
            "Payment was verified, but the subscription could not be activated.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully.",
    });
  } catch (error) {
    console.error("Verify subscription error:", error);

    return NextResponse.json(
      { error: "Something went wrong while verifying the payment." },
      { status: 500 }
    );
  }
}