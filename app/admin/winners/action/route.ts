import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ActionBody = {
  winnerId?: unknown;
  action?: unknown;
};

type WinnerAction = "approve" | "reject" | "paid";

export async function POST(request: Request) {
  try {
    let body: ActionBody;

    try {
      body = (await request.json()) as ActionBody;
    } catch {
      return NextResponse.json(
        {
          error: "Invalid request body.",
        },
        { status: 400 }
      );
    }

    const winnerId = Number(body.winnerId);
    const action = body.action as WinnerAction;

    if (
      !Number.isInteger(winnerId) ||
      winnerId <= 0
    ) {
      return NextResponse.json(
        {
          error: "Invalid winner ID.",
        },
        { status: 400 }
      );
    }

    if (
      action !== "approve" &&
      action !== "reject" &&
      action !== "paid"
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid action. Use approve, reject, or paid.",
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    // Check admin role
    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (
      profileError ||
      profile?.role !== "admin"
    ) {
      return NextResponse.json(
        {
          error: "Admin access required.",
        },
        { status: 403 }
      );
    }

    // Find the winner
    const {
      data: winner,
      error: winnerError,
    } = await supabase
      .from("winners")
      .select(
        "id, verification_status, payment_status"
      )
      .eq("id", winnerId)
      .single();

    if (winnerError || !winner) {
      console.error(
        "Winner lookup error:",
        winnerError
      );

      return NextResponse.json(
        {
          error: "Winner record not found.",
        },
        { status: 404 }
      );
    }

    // A winner must be approved before payment
    if (
      action === "paid" &&
      winner.verification_status !== "approved"
    ) {
      return NextResponse.json(
        {
          error:
            "A winner must be approved before it can be marked as paid.",
        },
        { status: 400 }
      );
    }

    // Already paid
    if (
      action === "paid" &&
      winner.payment_status === "paid"
    ) {
      return NextResponse.json({
        success: true,
        message:
          "Winner is already marked as paid.",
      });
    }

    let updateData:
      | { verification_status: string }
      | { payment_status: string };

    if (action === "approve") {
      updateData = {
        verification_status: "approved",
      };
    } else if (action === "reject") {
      updateData = {
        verification_status: "rejected",
      };
    } else {
      updateData = {
        payment_status: "paid",
      };
    }

    // Update winner
    const {
      data: updatedWinner,
      error: updateError,
    } = await supabase
      .from("winners")
      .update(updateData)
      .eq("id", winnerId)
      .select(
        "id, draw_id, user_id, match_type, prize_amount, proof_url, verification_status, payment_status"
      )
      .single();

    if (updateError || !updatedWinner) {
      console.error(
        "Winner update error:",
        updateError
      );

      return NextResponse.json(
        {
          error:
            updateError?.message ||
            "Unable to update the winner record.",
        },
        { status: 500 }
      );
    }

    const message =
      action === "approve"
        ? "Winner approved successfully."
        : action === "reject"
          ? "Winner rejected successfully."
          : "Winner marked as paid successfully.";

    return NextResponse.json({
      success: true,
      message,
      winner: updatedWinner,
    });
  } catch (error) {
    console.error(
      "Winner action error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while processing the winner action.",
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
  });
}