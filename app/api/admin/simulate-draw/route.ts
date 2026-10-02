import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type DrawEntry = {
  id: number;
  user_id: string;
  entry_numbers: unknown;
  created_at: string;
};

type Winner = {
  user_id: string;
  matches: number;
};

type PrizeResult = {
  pool: number;
  winnerCount: number;
  prizePerWinner: number;
  rollover: boolean;
};

function generateWinningNumbers(): number[] {
  const numbers = new Set<number>();

  while (numbers.size < 5) {
    numbers.add(
      Math.floor(Math.random() * 45) + 1
    );
  }

  return Array.from(numbers).sort(
    (a, b) => a - b
  );
}

function countMatches(
  entryNumbers: number[],
  winningNumbers: number[]
): number {
  const winningSet = new Set(winningNumbers);

  return entryNumbers.filter((number) =>
    winningSet.has(number)
  ).length;
}

function calculatePrize(
  pool: number,
  winners: Winner[],
  rolloverEligible: boolean
): PrizeResult {
  // No winners
  if (winners.length === 0) {
    return {
      pool,
      winnerCount: 0,
      prizePerWinner: 0,
      rollover: rolloverEligible,
    };
  }

  // Split the pool equally among winners
  return {
    pool,
    winnerCount: winners.length,
    prizePerWinner:
      Math.round(
        (pool / winners.length) * 100
      ) / 100,
    rollover: false,
  };
}

function normalizeEntryNumbers(
  entryNumbers: unknown
): number[] {
  if (!Array.isArray(entryNumbers)) {
    return [];
  }

  return entryNumbers
    .map(Number)
    .filter(
      (number) =>
        Number.isInteger(number) &&
        number >= 1 &&
        number <= 45
    );
}

function isValidTestEntry(
  numbers: number[]
): boolean {
  if (numbers.length !== 5) {
    return false;
  }

  return (
    new Set(numbers).size === 5
  );
}

export async function POST(
  request: Request
) {
  try {
    // ==================================================
    // READ REQUEST
    // ==================================================

    const body = await request
      .json()
      .catch(() => ({}));

    const requestedPrizePool = Number(
      body.prizePool
    );

    const prizePool =
      Number.isFinite(
        requestedPrizePool
      ) && requestedPrizePool > 0
        ? requestedPrizePool
        : 48000;

    // Test mode is ONLY for admin testing.
    // It does not change the normal random mode.
    const testWinner =
      body.testWinner === true;

    // ==================================================
    // SUPABASE CLIENT
    // ==================================================

    const supabase =
      await createClient();

    // ==================================================
    // 1. AUTHENTICATION
    // ==================================================

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error:
            "You must be logged in.",
        },
        {
          status: 401,
        }
      );
    }

    // ==================================================
    // 2. ADMIN ROLE
    // ==================================================

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
          error:
            "Admin access required.",
        },
        {
          status: 403,
        }
      );
    }

    // ==================================================
    // 3. ACTIVE SUBSCRIBERS
    // ==================================================

    const {
      data: subscriptions,
      error: subscriptionError,
    } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("status", "active");

    if (subscriptionError) {
      console.error(
        "Active subscriber query error:",
        subscriptionError
      );

      return NextResponse.json(
        {
          error:
            "Unable to read active subscribers.",
        },
        {
          status: 500,
        }
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

    // ==================================================
    // 4. NO ACTIVE SUBSCRIBERS
    // ==================================================

    if (
      activeUserIds.length === 0
    ) {
      const winningNumbers =
        generateWinningNumbers();

      return NextResponse.json({
        success: true,
        testWinner,
        winningNumbers,
        participantCount: 0,

        winners: {
          fiveMatch: [],
          fourMatch: [],
          threeMatch: [],
        },

        prizes: {
          fiveMatch: calculatePrize(
            prizePool * 0.4,
            [],
            true
          ),

          fourMatch: calculatePrize(
            prizePool * 0.35,
            [],
            false
          ),

          threeMatch: calculatePrize(
            prizePool * 0.25,
            [],
            false
          ),
        },
      });
    }

    // ==================================================
    // 5. GET DRAW ENTRIES
    // ==================================================

    const {
      data: entries,
      error: entriesError,
    } = await supabase
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
        "Draw entries query error:",
        entriesError
      );

      return NextResponse.json(
        {
          error:
            "Unable to read draw entries.",
        },
        {
          status: 500,
        }
      );
    }

    // ==================================================
    // 6. KEEP NEWEST ENTRY FOR EACH USER
    // ==================================================

    const latestEntries =
      new Map<string, DrawEntry>();

    for (
      const entry of (entries ?? []) as DrawEntry[]
    ) {
      if (
        !latestEntries.has(
          entry.user_id
        )
      ) {
        latestEntries.set(
          entry.user_id,
          entry
        );
      }
    }

    // ==================================================
    // 7. FIND TEST WINNER NUMBERS
    // ==================================================

    let winningNumbers: number[];

    if (testWinner) {
      // For test mode, use the newest valid
      // 5-number entry from an active subscriber.
      const firstValidEntry =
        Array.from(
          latestEntries.values()
        ).find((entry) => {
          const numbers =
            normalizeEntryNumbers(
              entry.entry_numbers
            );

          return isValidTestEntry(
            numbers
          );
        });

      if (!firstValidEntry) {
        return NextResponse.json(
          {
            error:
              "No active subscriber has a valid 5-number draw entry to use for the test winner.",
          },
          {
            status: 400,
          }
        );
      }

      winningNumbers =
        normalizeEntryNumbers(
          firstValidEntry.entry_numbers
        ).sort(
          (a, b) => a - b
        );
    } else {
      // Normal production-style simulation
      winningNumbers =
        generateWinningNumbers();
    }

    // ==================================================
    // 8. PREPARE WINNER GROUPS
    // ==================================================

    const fiveMatchWinners: Winner[] =
      [];

    const fourMatchWinners: Winner[] =
      [];

    const threeMatchWinners: Winner[] =
      [];

    // ==================================================
    // 9. CHECK MATCHES
    // ==================================================

    for (
      const entry of latestEntries.values()
    ) {
      const numbers =
        normalizeEntryNumbers(
          entry.entry_numbers
        );

      const matches =
        countMatches(
          numbers,
          winningNumbers
        );

      if (matches === 5) {
        fiveMatchWinners.push({
          user_id: entry.user_id,
          matches,
        });
      } else if (
        matches === 4
      ) {
        fourMatchWinners.push({
          user_id: entry.user_id,
          matches,
        });
      } else if (
        matches === 3
      ) {
        threeMatchWinners.push({
          user_id: entry.user_id,
          matches,
        });
      }
    }

    // ==================================================
    // 10. PRIZE DISTRIBUTION
    // ==================================================

    const prizes = {
      fiveMatch: calculatePrize(
        prizePool * 0.4,
        fiveMatchWinners,
        true
      ),

      fourMatch: calculatePrize(
        prizePool * 0.35,
        fourMatchWinners,
        false
      ),

      threeMatch: calculatePrize(
        prizePool * 0.25,
        threeMatchWinners,
        false
      ),
    };

    // ==================================================
    // 11. RETURN RESULT
    // ==================================================

    return NextResponse.json({
      success: true,

      // Lets the UI identify that this
      // was deliberately generated for testing.
      testWinner,

      winningNumbers,

      participantCount:
        latestEntries.size,

      winners: {
        fiveMatch:
          fiveMatchWinners,

        fourMatch:
          fourMatchWinners,

        threeMatch:
          threeMatchWinners,
      },

      prizes,
    });
  } catch (error) {
    console.error(
      "Draw simulation error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to run draw simulation.",
      },
      {
        status: 500,
      }
    );
  }
}