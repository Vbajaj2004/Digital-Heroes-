import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type PublishBody = {
  winningNumbers?: unknown;
  prizePool?: unknown;
};

type DrawEntry = {
  id: number;
  user_id: string;
  entry_numbers: unknown;
  created_at: string;
};

function countMatches(
  entryNumbers: number[],
  winningNumbers: number[]
) {
  const winningSet = new Set(winningNumbers);

  return entryNumbers.filter((number) =>
    winningSet.has(number)
  ).length;
}

function isValidWinningNumbers(
  value: unknown
): value is number[] {
  if (!Array.isArray(value) || value.length !== 5) {
    return false;
  }

  const numbers = value.map(Number);

  if (
    numbers.some(
      (number) =>
        !Number.isInteger(number) ||
        number < 1 ||
        number > 45
    )
  ) {
    return false;
  }

  return new Set(numbers).size === 5;
}

export async function POST(request: Request) {
  try {
    const body =
      (await request.json()) as PublishBody;

    if (
      !isValidWinningNumbers(
        body.winningNumbers
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Winning numbers must contain 5 unique numbers from 1 to 45.",
        },
        { status: 400 }
      );
    }

    const prizePool = Number(body.prizePool);

    if (
      !Number.isFinite(prizePool) ||
      prizePool <= 0
    ) {
      return NextResponse.json(
        {
          error: "Invalid prize pool.",
        },
        { status: 400 }
      );
    }

    const winningNumbers =
      [...body.winningNumbers].map(Number).sort(
        (a, b) => a - b
      );

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
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } =
      await supabase
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

    const drawDate = new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    ).format(new Date());

    const {
      data: existingDraw,
      error: existingError,
    } = await supabase
      .from("draws")
      .select("id")
      .eq("draw_date", drawDate)
      .eq("status", "published")
      .maybeSingle();

    if (existingError) {
      console.error(
        "Existing draw lookup error:",
        existingError
      );

      return NextResponse.json(
        {
          error: "Unable to check existing draws.",
        },
        { status: 500 }
      );
    }

    if (existingDraw) {
      return NextResponse.json(
        {
          error:
            `A published draw already exists for ${drawDate}.`,
        },
        { status: 409 }
      );
    }

    const {
      data: subscriptions,
      error: subscriptionError,
    } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("status", "active");

    if (subscriptionError) {
      console.error(
        "Subscriber lookup error:",
        subscriptionError
      );

      return NextResponse.json(
        {
          error:
            "Unable to load active subscribers.",
        },
        { status: 500 }
      );
    }

    const activeUserIds = [
      ...new Set(
        (subscriptions ?? []).map(
          (subscription) =>
            subscription.user_id
        )
      ),
    ];

    const { data: entries, error: entriesError } =
      await supabase
        .from("draw_entries")
        .select(
          "id, user_id, entry_numbers, created_at"
        )
        .in(
          "user_id",
          activeUserIds
        )
        .order("created_at", {
          ascending: false,
        });

    if (entriesError) {
      console.error(
        "Draw entries lookup error:",
        entriesError
      );

      return NextResponse.json(
        {
          error:
            "Unable to load draw entries.",
        },
        { status: 500 }
      );
    }

    const latestEntries =
      new Map<string, DrawEntry>();

    for (const entry of (entries ??
      []) as DrawEntry[]) {
      if (
        !latestEntries.has(entry.user_id)
      ) {
        latestEntries.set(
          entry.user_id,
          entry
        );
      }
    }

    const { data: draw, error: drawError } =
      await supabase
        .from("draws")
        .insert({
          draw_date: drawDate,
          draw_type: "random",
          status: "published",
          winning_numbers: winningNumbers,
          prize_pool: prizePool,
          published_at:
            new Date().toISOString(),
        })
        .select("id")
        .single();

    if (drawError || !draw) {
      console.error(
        "Draw creation error:",
        drawError
      );

      return NextResponse.json(
        {
          error:
            "Unable to publish the draw.",
        },
        { status: 500 }
      );
    }

    const winnerRows: {
      draw_id: number;
      user_id: string;
      match_type: number;
      prize_amount: number;
      verification_status: string;
      payment_status: string;
    }[] = [];

    const fiveMatchPool =
      prizePool * 0.4;

    const fourMatchPool =
      prizePool * 0.35;

    const threeMatchPool =
      prizePool * 0.25;

    const fiveWinners: string[] = [];
    const fourWinners: string[] = [];
    const threeWinners: string[] = [];

    for (const entry of latestEntries.values()) {
      const numbers = Array.isArray(
        entry.entry_numbers
      )
        ? entry.entry_numbers
            .map(Number)
            .filter((number) =>
              Number.isInteger(number)
            )
        : [];

      const matches = countMatches(
        numbers,
        winningNumbers
      );

      if (matches === 5) {
        fiveWinners.push(
          entry.user_id
        );
      } else if (matches === 4) {
        fourWinners.push(
          entry.user_id
        );
      } else if (matches === 3) {
        threeWinners.push(
          entry.user_id
        );
      }
    }

    if (fiveWinners.length > 0) {
      const prizeEach =
        Math.round(
          (fiveMatchPool /
            fiveWinners.length) *
            100
        ) / 100;

      for (const userId of fiveWinners) {
        winnerRows.push({
          draw_id: draw.id,
          user_id: userId,
          match_type: 5,
          prize_amount: prizeEach,
          verification_status:
            "pending",
          payment_status: "pending",
        });
      }
    }

    if (fourWinners.length > 0) {
      const prizeEach =
        Math.round(
          (fourMatchPool /
            fourWinners.length) *
            100
        ) / 100;

      for (const userId of fourWinners) {
        winnerRows.push({
          draw_id: draw.id,
          user_id: userId,
          match_type: 4,
          prize_amount: prizeEach,
          verification_status:
            "pending",
          payment_status: "pending",
        });
      }
    }

    if (threeWinners.length > 0) {
      const prizeEach =
        Math.round(
          (threeMatchPool /
            threeWinners.length) *
            100
        ) / 100;

      for (const userId of threeWinners) {
        winnerRows.push({
          draw_id: draw.id,
          user_id: userId,
          match_type: 3,
          prize_amount: prizeEach,
          verification_status:
            "pending",
          payment_status: "pending",
        });
      }
    }

    if (winnerRows.length > 0) {
      const {
        error: winnersError,
      } = await supabase
        .from("winners")
        .insert(winnerRows);

      if (winnersError) {
        console.error(
          "Winner creation error:",
          winnersError
        );

        await supabase
          .from("draws")
          .delete()
          .eq("id", draw.id);

        return NextResponse.json(
          {
            error:
              "Draw could not be completed because winner records could not be created.",
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,

      draw: {
        id: draw.id,
        drawDate,
        winningNumbers,
        prizePool,
      },

      winnerCounts: {
        fiveMatch: fiveWinners.length,
        fourMatch: fourWinners.length,
        threeMatch: threeWinners.length,
      },

      jackpotRolledOver:
        fiveWinners.length === 0,
    });
  } catch (error) {
    console.error(
      "Publish draw error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while publishing the draw.",
      },
      { status: 500 }
    );
  }
}