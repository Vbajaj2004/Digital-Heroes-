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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    onMessage("", "success");

    const numericScore = Number(score);

    if (!scoreDate) {
      onMessage("Please select a date.", "error");
      return;
    }

    if (
      !Number.isInteger(numericScore) ||
      numericScore < 1 ||
      numericScore > 45
    ) {
      onMessage("Score must be between 1 and 45.", "error");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("golf_scores").insert({
      user_id: userId,
      score: numericScore,
      score_date: scoreDate,
    });

    setLoading(false);

    if (error) {
      console.error("Supabase error:", error);

      if (error.code === "23505") {
        onMessage(
          "A score for this date already exists. Edit or delete the existing score instead.",
          "error"
        );
      } else {
        onMessage(error.message, "error");
      }

      return;
    }

    setScore("");
    setScoreDate("");

    onMessage("Score added successfully!", "success");

    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 md:grid-cols-[1fr_1fr_auto]"
    >
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
      </div>

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
          onChange={(e) => setScoreDate(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-[#07111f] px-4 py-3 text-white outline-none focus:border-emerald-400"
          required
        />
      </div>

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