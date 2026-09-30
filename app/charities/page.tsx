"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

type Charity = {
  id: number;
  name: string;
  description: string | null;
  upcoming_event: string | null;
  featured: boolean;
};

export default function CharitiesPage() {
  const router = useRouter();
  const supabase = createClient();

  const [charities, setCharities] = useState<Charity[]>([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedCharityId, setSelectedCharityId] =
    useState<number | null>(null);

  const [contributionPercentage, setContributionPercentage] =
    useState(10);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error"
  >("success");

  const [savedCharityId, setSavedCharityId] =
    useState<number | null>(null);

  useEffect(() => {
    async function loadData() {
      // Load charities
      const { data: charityData, error: charityError } =
        await supabase
          .from("charities")
          .select(
            "id, name, description, upcoming_event, featured"
          )
          .eq("active", true)
          .order("featured", { ascending: false });

      if (!charityError && charityData) {
        setCharities(charityData);
      }

      // Check logged-in user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Load current charity selection if logged in
      if (user) {
        const { data: selection } = await supabase
          .from("user_charities")
          .select("charity_id, contribution_percentage")
          .eq("user_id", user.id)
          .maybeSingle();

        if (selection) {
          setSavedCharityId(selection.charity_id);
        }
      }

      setLoading(false);
    }

    loadData();
  }, []);

  const filteredCharities = charities.filter((charity) =>
    charity.name.toLowerCase().includes(search.toLowerCase())
  );

  async function chooseCharity(charityId: number) {
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    setSelectedCharityId(charityId);
  }

  async function saveCharity(charityId: number) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    if (contributionPercentage < 10) {
      setMessage(
        "Contribution must be at least 10%."
      );
      setMessageType("error");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("user_charities")
      .upsert(
        {
          user_id: user.id,
          charity_id: charityId,
          contribution_percentage:
            contributionPercentage,
        },
        {
          onConflict: "user_id",
        }
      );

    setSaving(false);

    if (error) {
      console.error("Charity selection error:", error);

      setMessage(error.message);
      setMessageType("error");
      return;
    }

    setSavedCharityId(charityId);
    setSelectedCharityId(null);

    setMessage(
      "Charity selection saved successfully!"
    );
    setMessageType("success");
  }

  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      {/* Header */}
      <nav className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight"
          >
            DIGITAL
            <span className="text-emerald-400">.</span>
            HEROES
          </Link>

          <Link
            href="/protected"
            className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium transition hover:bg-white/10"
          >
            Dashboard
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
          Make an impact
        </p>

        <h1 className="mt-4 text-5xl font-bold tracking-tight md:text-6xl">
          Choose a cause that matters.
        </h1>

        <p className="mt-5 max-w-2xl text-lg leading-8 text-white/60">
          Explore charities supported by Digital Heroes and
          choose where your contribution should make an impact.
        </p>

        {/* Search */}
        <div className="mt-10 max-w-xl">
          <input
            type="text"
            placeholder="Search charities..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white outline-none placeholder:text-white/30 focus:border-emerald-400"
          />
        </div>
      </section>

      {/* Message */}
      {message && (
        <div
          className={`mx-auto max-w-7xl px-6 ${
            messageType === "error"
              ? "text-red-300"
              : "text-emerald-300"
          }`}
        >
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
            {message}
          </div>
        </div>
      )}

      {/* Charity cards */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        {loading ? (
          <div className="py-20 text-center text-white/50">
            Loading charities...
          </div>
        ) : filteredCharities.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-12 text-center">
            <h2 className="text-2xl font-semibold">
              No charities found
            </h2>

            <p className="mt-2 text-white/50">
              Try a different search.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredCharities.map((charity) => {
              const isSelected =
                savedCharityId === charity.id;

              const isChoosing =
                selectedCharityId === charity.id;

              return (
                <div
                  key={charity.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.03] p-7 transition hover:-translate-y-1 hover:border-emerald-400/30"
                >
                  <div className="flex items-center justify-between">
                    {charity.featured ? (
                      <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                        FEATURED
                      </span>
                    ) : (
                      <span />
                    )}

                    {isSelected && (
                      <span className="rounded-full bg-emerald-400 px-3 py-1 text-xs font-bold text-[#07111f]">
                        SELECTED
                      </span>
                    )}
                  </div>

                  <h2 className="mt-5 text-2xl font-bold">
                    {charity.name}
                  </h2>

                  <p className="mt-3 leading-7 text-white/55">
                    {charity.description}
                  </p>

                  {charity.upcoming_event && (
                    <div className="mt-6 rounded-2xl bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-wider text-white/40">
                        Upcoming event
                      </p>

                      <p className="mt-2 font-medium">
                        {charity.upcoming_event}
                      </p>
                    </div>
                  )}

                  {!isChoosing ? (
                    <button
                      type="button"
                      onClick={() =>
                        chooseCharity(charity.id)
                      }
                      className="mt-6 w-full rounded-full bg-emerald-400 px-5 py-3 font-semibold text-[#07111f] transition hover:bg-emerald-300"
                    >
                      {isSelected
                        ? "Change contribution"
                        : "Choose this charity"}
                    </button>
                  ) : (
                    <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-5">
                      <p className="text-sm font-semibold">
                        Contribution percentage
                      </p>

                      <p className="mt-1 text-sm text-white/50">
                        Minimum contribution is 10%.
                      </p>

                      <div className="mt-5 flex items-center gap-4">
                        <input
                          type="range"
                          min="10"
                          max="100"
                          step="5"
                          value={contributionPercentage}
                          onChange={(e) =>
                            setContributionPercentage(
                              Number(e.target.value)
                            )
                          }
                          className="w-full accent-emerald-400"
                        />

                        <span className="w-14 text-right text-xl font-bold text-emerald-300">
                          {contributionPercentage}%
                        </span>
                      </div>

                      <div className="mt-5 flex gap-3">
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() =>
                            saveCharity(charity.id)
                          }
                          className="flex-1 rounded-xl bg-emerald-400 px-4 py-3 font-semibold text-[#07111f] disabled:opacity-50"
                        >
                          {saving
                            ? "Saving..."
                            : "Save selection"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setSelectedCharityId(null)
                          }
                          className="rounded-xl border border-white/15 px-4 py-3 font-semibold hover:bg-white/10"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}