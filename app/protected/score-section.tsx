"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import ScoreForm from "./score-form";

type Score = {
  id: number;
  score: number;
  score_date: string;
};

type ScoreSectionProps = {
  userId: string;
  scores: Score[] | null;
};

export default function ScoreSection({
  userId,
  scores,
}: ScoreSectionProps) {
  const router = useRouter();
  const supabase = createClient();

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editScore, setEditScore] = useState("");
  const [editDate, setEditDate] = useState("");
  const [saving, setSaving] = useState(false);

  function handleMessage(
    newMessage: string,
    type: "success" | "error"
  ) {
    setMessage(newMessage);
    setMessageType(type);
  }

  function startEditing(score: Score) {
    setEditingId(score.id);
    setEditScore(String(score.score));
    setEditDate(score.score_date);
    setMessage("");
  }

  function cancelEditing() {
    setEditingId(null);
    setEditScore("");
    setEditDate("");
  }

  async function handleUpdate(scoreId: number) {
    const numericScore = Number(editScore);

    if (!editDate) {
      handleMessage("Please select a date.", "error");
      return;
    }

    if (
      !Number.isInteger(numericScore) ||
      numericScore < 1 ||
      numericScore > 45
    ) {
      handleMessage("Score must be between 1 and 45.", "error");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("golf_scores")
      .update({
        score: numericScore,
        score_date: editDate,
      })
      .eq("id", scoreId)
      .eq("user_id", userId);

    setSaving(false);

    if (error) {
      console.error("Update error:", error);

      if (error.code === "23505") {
        handleMessage(
          "Another score already exists for this date.",
          "error"
        );
      } else {
        handleMessage(error.message, "error");
      }

      return;
    }

    cancelEditing();
    handleMessage("Score updated successfully!", "success");
    router.refresh();
  }

  async function handleDelete(scoreId: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this score?"
    );

    if (!confirmed) {
      return;
    }

    const { error } = await supabase
      .from("golf_scores")
      .delete()
      .eq("id", scoreId)
      .eq("user_id", userId);

    if (error) {
      console.error("Delete error:", error);
      handleMessage(error.message, "error");
      return;
    }

    handleMessage("Score deleted successfully!", "success");
    router.refresh();
  }

  return (
    <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-400">
          Golf performance
        </p>

        <h2 className="mt-2 text-3xl font-bold">
          Your latest 5 scores
        </h2>

        <p className="mt-2 text-white/55">
          Only your latest five scores are shown.
        </p>
      </div>

      <ScoreForm
        userId={userId}
        onMessage={handleMessage}
      />

            <div
            id="scores"
            className="mt-8 rounded-3xl ..."
            >
            <div className="grid grid-cols-4 bg-white/5 px-5 py-4 text-sm font-semibold text-white/60">
          <span>Date</span>
          <span>Score</span>
          <span>Status</span>
          <span>Actions</span>
        </div>

        {scores && scores.length > 0 ? (
          scores.map((item) => (
            <div
              key={item.id}
              className="border-t border-white/10 px-5 py-4"
            >
              {editingId === item.id ? (
                <div className="grid gap-4 md:grid-cols-4 md:items-center">
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="rounded-xl border border-white/10 bg-[#07111f] px-3 py-2 text-white outline-none focus:border-emerald-400"
                  />

                  <input
                    type="number"
                    min="1"
                    max="45"
                    value={editScore}
                    onChange={(e) => setEditScore(e.target.value)}
                    className="rounded-xl border border-white/10 bg-[#07111f] px-3 py-2 text-white outline-none focus:border-emerald-400"
                  />

                  <span className="text-emerald-300">
                    Editing
                  </span>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleUpdate(item.id)}
                      className="rounded-lg bg-emerald-400 px-3 py-2 text-sm font-semibold text-[#07111f] disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>

                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/10"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-4 items-center text-sm">
                  <span>
                    {new Date(item.score_date).toLocaleDateString()}
                  </span>

                  <span className="font-semibold">
                    {item.score}
                  </span>

                  <span className="text-emerald-300">
                    Recorded
                  </span>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEditing(item)}
                      className="rounded-lg border border-white/15 px-3 py-2 text-sm font-medium transition hover:bg-white/10"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="rounded-lg border border-red-400/20 px-3 py-2 text-sm font-medium text-red-300 transition hover:bg-red-400/10"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="border-t border-white/10 px-5 py-10 text-center">
            <p className="font-medium">
              No scores added yet
            </p>

            <p className="mt-2 text-sm text-white/45">
              Add your first Stableford score to start tracking your
              performance.
            </p>
          </div>
        )}
      </div>

      {message && (
        <div
          className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
            messageType === "error"
              ? "border-red-400/20 bg-red-400/10 text-red-300"
              : "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
          }`}
        >
          {message}
        </div>
      )}
    </div>
  );
}