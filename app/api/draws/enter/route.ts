import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const drawId = Number(body.drawId);

    if (!Number.isInteger(drawId) || drawId <= 0) {
      return NextResponse.json(
        {
          error: "Invalid draw ID.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase = await createClient();

    // Check logged-in user
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

    // Check user's latest subscription
    const {
      data: subscription,
      error: subscriptionError,
    } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (subscriptionError) {
      console.error(
        "Subscription check error:",
        subscriptionError
      );

      return NextResponse.json(
        {
          error: "Unable to check subscription status.",
        },
        {
          status: 500,
        }
      );
    }

    if (subscription?.status !== "active") {
      return NextResponse.json(
        {
          error:
            "An active subscription is required to enter a draw.",
        },
        {
          status: 403,
        }
      );
    }

    // Make sure the draw exists and is published
    const {
      data: draw,
      error: drawError,
    } = await supabase
      .from("draws")
      .select("id, status")
      .eq("id", drawId)
      .eq("status", "published")
      .maybeSingle();

    if (drawError) {
      console.error(
        "Draw lookup error:",
        drawError
      );

      return NextResponse.json(
        {
          error: "Unable to find the draw.",
        },
        {
          status: 500,
        }
      );
    }

    if (!draw) {
      return NextResponse.json(
        {
          error: "This draw is not available.",
        },
        {
          status: 404,
        }
      );
    }

    // Get the user's latest five Stableford scores
    const {
      data: scores,
      error: scoresError,
    } = await supabase
      .from("golf_scores")
      .select("score, score_date")
      .eq("user_id", user.id)
      .order("score_date", {
        ascending: false,
      })
      .limit(5);

    if (scoresError) {
      console.error(
        "Golf score lookup error:",
        scoresError
      );

      return NextResponse.json(
        {
          error: "Unable to retrieve your golf scores.",
        },
        {
          status: 500,
        }
      );
    }

    // A draw entry needs five numbers
    if (!scores || scores.length < 5) {
      return NextResponse.json(
        {
          error:
            "Please enter your latest 5 golf scores before entering a draw.",
        },
        {
          status: 400,
        }
      );
    }

    // Use the five latest Stableford scores as the entry numbers.
    const entryNumbers = scores.map(
      (item) => Number(item.score)
    );

    // Enter the user into the draw
    const {
      error: insertError,
    } = await supabase
      .from("draw_entries")
      .insert({
        draw_id: drawId,
        user_id: user.id,
        entry_numbers: entryNumbers,
      });

    if (insertError) {
      // User already entered this draw
      if (insertError.code === "23505") {
        return NextResponse.json(
          {
            error:
              "You have already entered this draw.",
          },
          {
            status: 409,
          }
        );
      }

      console.error(
        "Draw entry insert error:",
        insertError
      );

      return NextResponse.json(
        {
          error: "Unable to enter the draw.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "You have successfully entered the draw.",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Enter draw error:",
      error
    );

    return NextResponse.json(
      {
        error: "Something went wrong.",
      },
      {
        status: 500,
      }
    );
  }
}