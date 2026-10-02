import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

import { createClient } from "@/lib/supabase/server";

async function updateProfile(formData: FormData) {
  "use server";

  const fullName = String(
    formData.get("full_name") || ""
  ).trim();

  if (!fullName) {
    redirect("/protected/profile?error=name");
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
    })
    .eq("id", user.id);

  if (error) {
    redirect("/protected/profile?error=update");
  }

  redirect("/protected/profile?updated=1");
}

async function ProfileContent({
  searchParams,
}: {
  searchParams: Promise<{
    updated?: string;
    error?: string;
  }>;
}) {
  const supabase = await createClient();

  // =========================================================
  // AUTHENTICATION
  // =========================================================

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  // =========================================================
  // PROFILE
  // =========================================================

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const fullName =
    profile?.full_name || "";

  const role =
    profile?.role || "subscriber";

  // =========================================================
  // URL PARAMETERS
  // =========================================================

  const params = await searchParams;

  const updated =
    params.updated === "1";

  const nameError =
    params.error === "name";

  const updateError =
    params.error === "update";

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <main className="min-h-screen bg-[#07111f] text-white">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <section className="border-b border-white/10">
        <div className="mx-auto max-w-4xl px-6 py-8">

          <Link
            href="/protected"
            className="text-sm text-emerald-300 transition hover:text-emerald-200"
          >
            ← Back to dashboard
          </Link>

          <p className="mt-8 text-sm uppercase tracking-[0.2em] text-emerald-400">
            Account
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            Profile settings
          </h1>

          <p className="mt-2 text-white/55">
            Manage your account details.
          </p>

        </div>
      </section>

      {/* =====================================================
          PROFILE INFORMATION
      ====================================================== */}

      <section className="mx-auto max-w-4xl px-6 py-10">

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">

          <h2 className="text-2xl font-semibold">
            Personal information
          </h2>

          {/* SUCCESS MESSAGE */}

          {updated && (
            <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-300">
              Profile updated successfully.
            </div>
          )}

          {/* NAME ERROR */}

          {nameError && (
            <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-sm text-red-300">
              Please enter your full name.
            </div>
          )}

          {/* UPDATE ERROR */}

          {updateError && (
            <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-sm text-red-300">
              Unable to update your profile. Please try again.
            </div>
          )}

          {/* =================================================
              FORM
          ================================================== */}

          <form
            action={updateProfile}
            className="mt-6 space-y-6"
          >

            {/* FULL NAME */}

            <div>

              <label
                htmlFor="full_name"
                className="text-sm text-white/45"
              >
                Full name
              </label>

              <input
                id="full_name"
                name="full_name"
                type="text"
                defaultValue={fullName}
                placeholder="Enter your full name"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white outline-none transition placeholder:text-white/30 focus:border-emerald-400/50 focus:bg-white/10"
              />

            </div>

            {/* EMAIL */}

            <div className="rounded-2xl bg-white/5 p-5">

              <p className="text-sm text-white/45">
                Email address
              </p>

              <p className="mt-2 break-all text-lg font-medium">
                {user.email || "Not available"}
              </p>

              <p className="mt-2 text-xs text-white/35">
                Your login email is managed through
                your authentication account.
              </p>

            </div>

            {/* ACCOUNT TYPE */}

            <div className="rounded-2xl bg-white/5 p-5">

              <p className="text-sm text-white/45">
                Account type
              </p>

              <p className="mt-2 text-lg font-medium capitalize">
                {role}
              </p>

            </div>

            {/* ACCOUNT ID */}

            <div className="rounded-2xl bg-white/5 p-5">

              <p className="text-sm text-white/45">
                Account ID
              </p>

              <p className="mt-2 break-all font-mono text-sm text-white/70">
                {user.id}
              </p>

            </div>

            {/* SAVE */}

            <button
              type="submit"
              className="w-full rounded-full bg-emerald-400 px-6 py-3.5 font-semibold text-[#07111f] transition hover:bg-emerald-300"
            >
              Save changes
            </button>

          </form>

        </div>

      </section>

    </main>
  );
}

function ProfileLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#07111f] text-white">

      <div className="text-center">

        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-emerald-400" />

        <p className="mt-4 text-white/60">
          Loading profile...
        </p>

      </div>

    </main>
  );
}

// ===========================================================
// PAGE WRAPPER
// ===========================================================

export default function ProfileSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    updated?: string;
    error?: string;
  }>;
}) {
  return (
    <Suspense fallback={<ProfileLoading />}>
      <ProfileContent
        searchParams={searchParams}
      />
    </Suspense>
  );
}