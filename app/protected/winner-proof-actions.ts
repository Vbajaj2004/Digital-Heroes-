"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const BUCKET_NAME = "winner-proofs";
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export async function uploadWinnerProof(
  formData: FormData
) {
  const winnerId = Number(
    formData.get("winnerId")
  );

  const file = formData.get("proof");

  if (
    !Number.isInteger(winnerId) ||
    winnerId <= 0
  ) {
    return {
      success: false,
      message: "Invalid winner record.",
    };
  }

  if (!(file instanceof File)) {
    return {
      success: false,
      message: "Please choose a screenshot to upload.",
    };
  }

  if (file.size <= 0) {
    return {
      success: false,
      message: "The selected file is empty.",
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      message: "Proof image must be 5 MB or smaller.",
    };
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return {
      success: false,
      message:
        "Please upload a JPG, PNG, or WEBP screenshot.",
    };
  }

  const supabase = await createClient();

  // ----------------------------------------------------------
  // Authentication
  // ----------------------------------------------------------

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      message: "You must be logged in.",
    };
  }

  // ----------------------------------------------------------
  // Confirm this winner belongs to the logged-in user
  // ----------------------------------------------------------

  const {
    data: winner,
    error: winnerError,
  } = await supabase
    .from("winners")
    .select("id, user_id, proof_url")
    .eq("id", winnerId)
    .eq("user_id", user.id)
    .single();

  if (winnerError || !winner) {
    return {
      success: false,
      message:
        "Winner record not found for your account.",
    };
  }

  // ----------------------------------------------------------
  // Generate a safe storage path
  // ----------------------------------------------------------

  const extension =
    file.type === "image/jpeg"
      ? "jpg"
      : file.type === "image/png"
        ? "png"
        : "webp";

  const filePath =
    `${user.id}/${winnerId}-${crypto.randomUUID()}.${extension}`;

  // ----------------------------------------------------------
  // Upload proof
  // ----------------------------------------------------------

  const {
    error: uploadError,
  } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error(
      "Winner proof upload error:",
      uploadError
    );

    return {
      success: false,
      message:
        "Unable to upload proof. Make sure the winner-proofs storage bucket exists.",
    };
  }

  // ----------------------------------------------------------
  // Get public URL
  // ----------------------------------------------------------

  const {
    data: publicUrlData,
  } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  const proofUrl =
    publicUrlData.publicUrl;

  // ----------------------------------------------------------
  // Save proof URL to winner
  // ----------------------------------------------------------

  const {
    error: updateError,
  } = await supabase
    .from("winners")
    .update({
      proof_url: proofUrl,
    })
    .eq("id", winnerId)
    .eq("user_id", user.id);

  if (updateError) {
    console.error(
      "Winner proof database update error:",
      updateError
    );

    // Remove uploaded file when DB update fails.
    await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    return {
      success: false,
      message:
        updateError.message ||
        "Proof was uploaded but could not be saved.",
    };
  }

  revalidatePath("/protected");
  revalidatePath("/admin/winners");

  return {
    success: true,
    message:
      "Winner proof uploaded successfully.",
    proofUrl,
  };
}
