import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Check logged-in user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check admin role
    const { data: adminProfile, error: adminError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .single();

    if (adminError || !adminProfile || adminProfile.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    // Get users
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, role, created_at")
      .order("created_at", { ascending: false });

    if (profilesError) {
      return NextResponse.json(
        {
          success: false,
          error: profilesError.message,
        },
        { status: 500 }
      );
    }

    // Get subscriptions
    const { data: subscriptions, error: subscriptionsError } =
      await supabase
        .from("subscriptions")
        .select(
          "id, user_id, plan, status, renewal_date, created_at, razorpay_subscription_id"
        )
        .order("created_at", { ascending: false });

    if (subscriptionsError) {
      return NextResponse.json(
        {
          success: false,
          error: subscriptionsError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      users: profiles ?? [],
      subscriptions: subscriptions ?? [],
    });
  } catch (error) {
    console.error("Admin users GET error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    // Check logged-in user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check admin role
    const { data: adminProfile, error: adminError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .single();

    if (adminError || !adminProfile || adminProfile.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    // Read request body
    const body = await request.json();

    const userId = body.userId;
    const fullName = body.fullName;
    const role = body.role;

    // Validate required values
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    if (typeof fullName !== "string") {
      return NextResponse.json(
        { success: false, error: "Full name must be a string" },
        { status: 400 }
      );
    }

    if (role !== "admin" && role !== "subscriber") {
      return NextResponse.json(
        {
          success: false,
          error: "Role must be admin or subscriber",
        },
        { status: 400 }
      );
    }

    // Prevent admin from removing their own admin role
    if (userId === user.id && role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "You cannot remove your own admin role.",
        },
        { status: 400 }
      );
    }

    // Make sure target profile exists
    const { data: targetProfile, error: targetError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (targetError || !targetProfile) {
      return NextResponse.json(
        {
          success: false,
          error: "Target user not found.",
        },
        { status: 404 }
      );
    }

    // Update user profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        role,
      })
      .eq("id", userId)
      .select("id, full_name, role, created_at")
      .single();

    if (updateError) {
      console.error("Profile update error:", updateError);

      return NextResponse.json(
        {
          success: false,
          error: updateError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      user: updatedProfile,
    });
  } catch (error) {
    console.error("Admin users PATCH error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}