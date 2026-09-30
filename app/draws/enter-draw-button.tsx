"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type EnterDrawButtonProps = {
  drawId: number;
};

export default function EnterDrawButton({
  drawId,
}: EnterDrawButtonProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleEnter() {
    setLoading(true);
    setMessage("");
    setSuccess(false);

    try {
      const response = await fetch("/api/draws/enter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          drawId,
        }),
      });

      const responseText = await response.text();

      console.log("Enter draw response:", {
        status: response.status,
        statusText: response.statusText,
        body: responseText,
      });

      let data: {
        error?: string;
        message?: string;
      } = {};

      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch (error) {
          console.error(
            "Invalid JSON response:",
            error
          );

          setMessage(
            `Server returned an invalid response (${response.status}).`
          );

          return;
        }
      }

      if (!response.ok) {
        setMessage(
          data.error ||
            `Request failed with status ${response.status}.`
        );

        return;
      }

      setSuccess(true);

      setMessage(
        data.message ||
          "You have successfully entered the draw."
      );

      // Refresh the server component so the
      // participation count updates immediately.
      router.refresh();
    } catch (error) {
      console.error(
        "Enter draw request failed:",
        error
      );

      setMessage(
        "Could not contact the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={handleEnter}
        disabled={loading || success}
        className="w-full rounded-full bg-emerald-400 px-5 py-3 font-semibold text-[#07111f] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? "Entering..."
          : success
          ? "Entered ✓"
          : "Enter This Draw"}
      </button>

      {message && (
        <p
          className={`mt-3 text-center text-sm ${
            success
              ? "text-emerald-300"
              : "text-red-300"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}