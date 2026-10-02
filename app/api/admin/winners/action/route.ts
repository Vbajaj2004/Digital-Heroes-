import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

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

    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profileError || profile?.role !== "admin") {
      return NextResponse.json(
        {
          error: "Admin access required.",
        },
        {
          status: 403,
        }
      );
    }

    const { data: winners, error } = await supabase
      .from("winners")
      .select(
        "id, draw_id, user_id, match_type, prize_amount, proof_url, verification_status, payment_status"
      )
      .order("id", {
        ascending: false,
      });

    if (error) {
      console.error("Winner fetch error:", error);

      return NextResponse.json(
        {
          error: "Unable to load winner records.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      winners: winners ?? [],
    });
  } catch (error) {
    console.error("Admin winners error:", error);

    return NextResponse.json(
      {
        error: "Something went wrong while loading winners.",
      },
      {
        status: 500,
      }
    );
  }
}