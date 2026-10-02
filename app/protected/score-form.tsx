"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

type ScoreFormProps = {
  userId: string;
  onMessage: (message: string, type: "success" | "error") => void;
};

export default function ScoreForm({
  userId,
  onMessage,
}: ScoreFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [score, setScore] = useState("");
  const [scoreDate, setScoreDate] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    onMessage("", "success");

    const numericScore = Number(score);

    // Validate date
    if (!scoreDate) {
      onMessage("Please select a date.", "error");
      return;
    }

    // Validate score
    if (
      !Number.isInteger(numericScore) ||
      numericScore < 1 ||
      numericScore > 45
    ) {
      onMessage(
        "Score must be between 1 and 45.",
        "error"
      );
      return;
    }

    setLoading(true);

    try {
      // --------------------------------------------------
      // STEP 1: Check whether this date already exists
      // --------------------------------------------------
      const {
        data: existingScore,
        error: existingScoreError,
      } = await supabase
        .from("golf_scores")
        .select("id")
        .eq("user_id", userId)
        .eq("score_date", scoreDate)
        .maybeSingle();

      if (existingScoreError) {
        console.error(
          "Duplicate-date check failed:",
          existingScoreError
        );

        onMessage(
          "Unable to check this score date. Please try again.",
          "error"
        );

        return;
      }

      // --------------------------------------------------
      // STEP 2: Show a friendly message for duplicates
      // --------------------------------------------------
      if (existingScore) {
        onMessage(
          "A score for this date already exists. Please edit or delete the existing score instead.",
          "error"
        );

        return;
      }

      // --------------------------------------------------
      // STEP 3: Insert the new score
      // --------------------------------------------------
      const { error: insertError } = await supabase
        .from("golf_scores")
        .insert({
          user_id: userId,
          score: numericScore,
          score_date: scoreDate,
        });

      if (insertError) {
        console.error(
          "Supabase insert error:",
          insertError
        );

        // Keep a friendly fallback for duplicate constraints
        if (insertError.code === "23505") {
          onMessage(
            "A score for this date already exists. Please edit or delete the existing score instead.",
            "error"
          );
        } else {
          onMessage(
            "Unable to add the score. Please try again.",
            "error"
          );
        }

        return;
      }

      // --------------------------------------------------
      // STEP 4: Clear form after successful insert
      // --------------------------------------------------
      setScore("");
      setScoreDate("");

      onMessage(
        "Score added successfully!",
        "success"
      );

      // Refresh server-rendered dashboard data
      router.refresh();
    } catch (error) {
      console.error(
        "Unexpected score error:",
        error
      );

      onMessage(
        "Something went wrong while adding the score.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 md:grid-cols-[1fr_1fr_auto]"
    >
      {/* Score */}
      <div>
        <label
          htmlFor="score"
          className="mb-2 block text-sm text-white/60"
        >
          Stableford score
        </label>

        <input
          id="score"
          type="number"
          min="1"
          max="45"
          value={score}
          onChange={(e) => setScore(e.target.value)}
          placeholder="1 - 45"
          className="w-full rounded-xl border border-white/10 bg-[#07111f] px-4 py-3 text-white outline-none focus:border-emerald-400"
          required
        />

        <p className="mt-2 text-xs text-white/35">
          Enter a score from 1 to 45.
        </p>
      </div>

      {/* Date */}
      <div>
        <label
          htmlFor="scoreDate"
          className="mb-2 block text-sm text-white/60"
        >
          Score date
        </label>

        <input
          id="scoreDate"
          type="date"
          value={scoreDate}
          onChange={(e) =>
            setScoreDate(e.target.value)
          }
          className="w-full rounded-xl border border-white/10 bg-[#07111f] px-4 py-3 text-white outline-none focus:border-emerald-400"
          required
        />

        <p className="mt-2 text-xs text-white/35">
          Only one score is allowed per date.
        </p>
      </div>

      {/* Submit */}
      <div className="flex items-end">
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-emerald-400 px-6 py-3 font-semibold text-[#07111f] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Adding..." : "Add score"}
        </button>
      </div>
    </form>
  );
}