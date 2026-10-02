"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Winner = {
  id: number;
  draw_id: number;
  user_id: string;
  match_type: string | number;
  prize_amount: number;
  proof_url: string | null;
  verification_status: string;
  payment_status: string;
};

type WinnerAction =
  | "approve"
  | "reject"
  | "paid";

async function verifyAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("You must be logged in.");
  }

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
    throw new Error("Admin access required.");
  }

  return supabase;
}

export async function getWinners(): Promise<Winner[]> {
  const supabase = await verifyAdmin();

  const {
    data,
    error,
  } = await supabase
    .from("winners")
    .select(
      "id, draw_id, user_id, match_type, prize_amount, proof_url, verification_status, payment_status"
    )
    .order("id", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Winner loading error:",
      error
    );

    throw new Error(
      error.message ||
        "Unable to load winners."
    );
  }

  return (data ?? []) as Winner[];
}

export async function updateWinner(
  winnerId: number,
  action: WinnerAction
) {
  if (
    !Number.isInteger(winnerId) ||
    winnerId <= 0
  ) {
    throw new Error("Invalid winner ID.");
  }

  if (
    action !== "approve" &&
    action !== "reject" &&
    action !== "paid"
  ) {
    throw new Error("Invalid winner action.");
  }

  const supabase = await verifyAdmin();

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
    throw new Error(
      "Winner record not found."
    );
  }

  // Payment is allowed only after approval.
  if (
    action === "paid" &&
    winner.verification_status !== "approved"
  ) {
    throw new Error(
      "A winner must be approved before it can be marked as paid."
    );
  }

  // Prevent duplicate paid action.
  if (
    action === "paid" &&
    winner.payment_status === "paid"
  ) {
    return {
      success: true,
      message:
        "Winner is already marked as paid.",
    };
  }

  const updateData =
    action === "approve"
      ? {
          verification_status: "approved",
        }
      : action === "reject"
        ? {
            verification_status: "rejected",
          }
        : {
            payment_status: "paid",
          };

  const {
    error: updateError,
  } = await supabase
    .from("winners")
    .update(updateData)
    .eq("id", winnerId);

  if (updateError) {
    console.error(
      "Winner update error:",
      updateError
    );

    throw new Error(
      updateError.message ||
        "Unable to update the winner record."
    );
  }

  revalidatePath("/admin/winners");
  revalidatePath("/protected");

  const message =
    action === "approve"
      ? "Winner approved successfully."
      : action === "reject"
        ? "Winner rejected successfully."
        : "Winner marked as paid successfully.";

  return {
    success: true,
    message,
  };
}