"use client";

import { useRef, useState } from "react";
import { uploadWinnerProof } from "./winner-proof-actions";

type Winner = {
  id: number;
  draw_id: number;
  match_type: string | number | null;
  prize_amount: number | null;
  proof_url: string | null;
  payment_status: string | null;
  verification_status: string | null;
};

export default function WinnerProof({
  winners,
}: {
  winners: Winner[];
}) {
  const [uploadingId, setUploadingId] =
    useState<number | null>(null);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const inputRefs = useRef<
    Record<number, HTMLInputElement | null>
  >({});

  if (winners.length === 0) {
    return null;
  }

  async function handleUpload(
    winnerId: number
  ) {
    const input =
      inputRefs.current[winnerId];

    const file = input?.files?.[0];

    if (!file) {
      setError(
        "Please choose a screenshot first."
      );
      setMessage("");
      return;
    }

    setUploadingId(winnerId);
    setError("");
    setMessage("");

    try {
      const formData = new FormData();

      formData.append(
        "winnerId",
        String(winnerId)
      );

      formData.append(
        "proof",
        file
      );

      const result =
        await uploadWinnerProof(formData);

      if (!result.success) {
        throw new Error(
          result.message ||
            "Unable to upload proof."
        );
      }

      setMessage(
        result.message ||
          "Winner proof uploaded successfully."
      );

      // Clear the file input after a successful upload.
      if (input) {
        input.value = "";
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to upload proof."
      );
    } finally {
      setUploadingId(null);
    }
  }

  function formatStatus(
    status: string | number | null
  ) {
    if (status === null) {
      return "Unknown";
    }

    return String(status)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  }

  return (
    <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
          Winner verification
        </p>

        <h2 className="mt-3 text-2xl font-bold">
          Upload score proof
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
          Upload a screenshot of your golf scores as
          proof for a winning draw. JPG, PNG, or WEBP
          files up to 5 MB are supported.
        </p>
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {message && (
        <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-300">
          {message}
        </div>
      )}

      <div className="mt-6 space-y-4">
        {winners.map((winner) => {
          const isUploading =
            uploadingId === winner.id;

          return (
            <div
              key={winner.id}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-5"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="font-semibold">
                    Draw #{winner.draw_id}
                    {" · "}
                    {formatStatus(
                      winner.match_type
                    )}{" "}
                    match
                  </p>

                  <p className="mt-2 text-sm text-white/45">
                    Prize: ₹
                    {Number(
                      winner.prize_amount || 0
                    ).toLocaleString("en-IN")}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/60">
                      Verification:{" "}
                      {formatStatus(
                        winner.verification_status
                      )}
                    </span>

                    <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/60">
                      Payment:{" "}
                      {formatStatus(
                        winner.payment_status
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex min-w-[280px] flex-col gap-3">
                  {winner.proof_url ? (
                    <a
                      href={winner.proof_url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-5 py-3 text-center text-sm font-semibold text-emerald-300 transition hover:bg-emerald-400/20"
                    >
                      View uploaded proof
                    </a>
                  ) : (
                    <p className="text-sm text-white/40">
                      No proof uploaded yet.
                    </p>
                  )}

                  <input
                    ref={(element) => {
                      inputRefs.current[
                        winner.id
                      ] = element;
                    }}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="block w-full text-sm text-white/50 file:mr-4 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-white/15"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      handleUpload(
                        winner.id
                      )
                    }
                    disabled={isUploading}
                    className="rounded-full bg-emerald-400 px-5 py-3 font-semibold text-[#07111f] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isUploading
                      ? "Uploading..."
                      : winner.proof_url
                        ? "Replace Proof"
                        : "Upload Proof"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}