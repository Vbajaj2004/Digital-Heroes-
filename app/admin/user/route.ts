import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    // =======================================================
    // AUTHENTICATION
    // =======================================================

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: "You must be logged in.",
        },
        {
          status: 401,
        }
      );
    }

    // =======================================================
    // CURRENT USER ADMIN CHECK
    // =======================================================

    const {
      data: currentProfile,
      error: currentProfileError,
    } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (
      currentProfileError ||
      currentProfile?.role !== "admin"
    ) {
      return NextResponse.json(
        {
          error:
            "Administrator access required.",
        },
        {
          status: 403,
        }
      );
    }

    // =======================================================
    // REQUEST BODY
    // =======================================================

    const body = await request.json();

    const targetUserId =
      typeof body.userId === "string"
        ? body.userId.trim()
        : "";

    const fullName =
      typeof body.fullName === "string"
        ? body.fullName.trim()
        : "";

    const role = body.role;

    // =======================================================
    // VALIDATION
    // =======================================================

    if (!targetUserId) {
      return NextResponse.json(
        {
          error: "User ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!fullName) {
      return NextResponse.json(
        {
          error:
            "Full name cannot be empty.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      role !== "admin" &&
      role !== "subscriber"
    ) {
      return NextResponse.json(
        {
          error: "Invalid user role.",
        },
        {
          status: 400,
        }
      );
    }

    // =======================================================
    // PREVENT SELF-DEMOTION
    // =======================================================

    if (
      targetUserId === user.id &&
      role !== "admin"
    ) {
      return NextResponse.json(
        {
          error:
            "You cannot remove your own administrator access.",
        },
        {
          status: 400,
        }
      );
    }

    // =======================================================
    // CHECK TARGET USER EXISTS
    // =======================================================

    const { data: targetUser, error: targetError } =
      await supabase
        .from("profiles")
        .select("id, full_name, role")
        .eq("id", targetUserId)
        .maybeSingle();

    if (targetError) {
      console.error(
        "Target user lookup error:",
        targetError
      );

      return NextResponse.json(
        {
          error:
            "Unable to find the selected user.",
        },
        {
          status: 500,
        }
      );
    }

    if (!targetUser) {
      return NextResponse.json(
        {
          error: "User not found.",
        },
        {
          status: 404,
        }
      );
    }

    // =======================================================
    // UPDATE
    // =======================================================

    const {
      data: updatedUser,
      error: updateError,
    } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        role,
      })
      .eq("id", targetUserId)
      .select("id, full_name, role")
      .single();

    if (updateError) {
      console.error(
        "Profile update error:",
        updateError
      );

      return NextResponse.json(
        {
          error:
            updateError.message ||
            "Unable to update user.",
        },
        {
          status: 500,
        }
      );
    }

    // =======================================================
    // SUCCESS
    // =======================================================

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error(
      "Admin user API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unexpected server error.",
      },
      {
        status: 500,
      }
    );
  }
}