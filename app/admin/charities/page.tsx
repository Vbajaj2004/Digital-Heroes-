"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  Charity,
  createCharity,
  deleteCharity,
  getCharities,
  updateCharity,
} from "./actions";

type FormState = {
  name: string;
  description: string;
  image_url: string;
  event_name: string;
  event_date: string;
  event_location: string;
  active: boolean;
  featured: boolean;
};

const emptyForm: FormState = {
  name: "",
  description: "",
  image_url: "",
  event_name: "",
  event_date: "",
  event_location: "",
  active: true,
  featured: false,
};

function charityToForm(charity: Charity): FormState {
  return {
    name: charity.name ?? "",
    description: charity.description ?? "",
    image_url: charity.image_url ?? "",
    event_name: charity.event_name ?? "",
    event_date: charity.event_date ?? "",
    event_location: charity.event_location ?? "",
    active: charity.active,
    featured: charity.featured,
  };
}

export default function AdminCharitiesPage() {
  const [charities, setCharities] = useState<Charity[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState<number | null>(
    null
  );

  const [form, setForm] =
    useState<FormState>(emptyForm);

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadCharities() {
    setLoading(true);
    setError("");

    try {
      const data = await getCharities();
      setCharities(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load charities."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCharities();
  }, []);

  function startAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function startEdit(charity: Charity) {
    setEditingId(charity.id);
    setForm(charityToForm(charity));
    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  }

  function updateField<K extends keyof FormState>(
    field: K,
    value: FormState[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    try {
      if (editingId === null) {
        await createCharity(form);
        setMessage("Charity added successfully.");
      } else {
        await updateCharity(editingId, form);
        setMessage("Charity updated successfully.");
      }

      setEditingId(null);
      setForm(emptyForm);

      await loadCharities();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save charity."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm(
      "Delete this charity permanently?"
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(id);
    setError("");
    setMessage("");

    try {
      await deleteCharity(id);

      setMessage("Charity deleted successfully.");

      if (editingId === id) {
        setEditingId(null);
        setForm(emptyForm);
      }

      await loadCharities();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete charity."
      );
    } finally {
      setDeletingId(null);
    }
  }

  const activeCount = charities.filter(
    (charity) => charity.active
  ).length;

  const featuredCount = charities.filter(
    (charity) => charity.featured
  ).length;

  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      {/* Navigation */}
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

          <div className="flex items-center gap-3">
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-semibold text-emerald-300">
              CHARITY MANAGEMENT
            </span>

            <Link
              href="/admin"
              className="rounded-full border border-white/10 px-5 py-2.5 text-sm transition hover:bg-white/10"
            >
              Admin Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
              Admin control
            </p>

            <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
              Charity Management
            </h1>

            <p className="mt-4 max-w-2xl text-white/55">
              Add, edit and manage charity listings,
              content, events and featured visibility.
            </p>
          </div>

          <button
            type="button"
            onClick={startAdd}
            className="rounded-full bg-emerald-400 px-6 py-3 font-semibold text-[#07111f] transition hover:bg-emerald-300"
          >
            + Add Charity
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-8 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-300">
            {message}
          </div>
        )}

        {/* Stats */}
        <section className="mt-10 grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm text-white/45">
              Total charities
            </p>

            <p className="mt-3 text-3xl font-bold">
              {charities.length}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm text-white/45">
              Active charities
            </p>

            <p className="mt-3 text-3xl font-bold">
              {activeCount}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm text-white/45">
              Featured charities
            </p>

            <p className="mt-3 text-3xl font-bold">
              {featuredCount}
            </p>
          </div>
        </section>

        {/* Add / Edit Form */}
        <section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-7">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-emerald-400">
                {editingId === null
                  ? "New charity"
                  : `Editing charity #${editingId}`}
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                {editingId === null
                  ? "Add Charity"
                  : "Edit Charity"}
              </h2>
            </div>

            {editingId !== null && (
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-full border border-white/10 px-4 py-2 text-sm transition hover:bg-white/10"
              >
                Cancel
              </button>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-7 grid gap-6"
          >
            <div>
              <label className="text-sm text-white/60">
                Charity name
              </label>

              <input
                value={form.name}
                onChange={(event) =>
                  updateField(
                    "name",
                    event.target.value
                  )
                }
                placeholder="Enter charity name"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition focus:border-emerald-400/50"
                required
              />
            </div>

            <div>
              <label className="text-sm text-white/60">
                Description
              </label>

              <textarea
                value={form.description}
                onChange={(event) =>
                  updateField(
                    "description",
                    event.target.value
                  )
                }
                placeholder="Describe the charity and its mission"
                rows={4}
                className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition focus:border-emerald-400/50"
              />
            </div>

            <div>
              <label className="text-sm text-white/60">
                Image URL
              </label>

              <input
                value={form.image_url}
                onChange={(event) =>
                  updateField(
                    "image_url",
                    event.target.value
                  )
                }
                placeholder="https://example.com/charity-image.jpg"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition focus:border-emerald-400/50"
              />

              <p className="mt-2 text-xs text-white/35">
                Use a public image URL for now.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <label className="text-sm text-white/60">
                  Upcoming event
                </label>

                <input
                  value={form.event_name}
                  onChange={(event) =>
                    updateField(
                      "event_name",
                      event.target.value
                    )
                  }
                  placeholder="Charity Golf Day"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition focus:border-emerald-400/50"
                />
              </div>

              <div>
                <label className="text-sm text-white/60">
                  Event date
                </label>

                <input
                  type="date"
                  value={form.event_date}
                  onChange={(event) =>
                    updateField(
                      "event_date",
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-emerald-400/50"
                />
              </div>

              <div>
                <label className="text-sm text-white/60">
                  Event location
                </label>

                <input
                  value={form.event_location}
                  onChange={(event) =>
                    updateField(
                      "event_location",
                      event.target.value
                    )
                  }
                  placeholder="Mumbai"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition focus:border-emerald-400/50"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) =>
                    updateField(
                      "active",
                      event.target.checked
                    )
                  }
                  className="h-4 w-4"
                />

                <span>
                  <span className="block font-semibold">
                    Active
                  </span>

                  <span className="mt-1 block text-xs text-white/40">
                    Show this charity in the user directory.
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(event) =>
                    updateField(
                      "featured",
                      event.target.checked
                    )
                  }
                  className="h-4 w-4"
                />

                <span>
                  <span className="block font-semibold">
                    Featured
                  </span>

                  <span className="mt-1 block text-xs text-white/40">
                    Mark this charity for homepage spotlight.
                  </span>
                </span>
              </label>
            </div>

            <div>
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-emerald-400 px-6 py-3 font-semibold text-[#07111f] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingId === null
                  ? "Add Charity"
                  : "Save Changes"}
              </button>
            </div>
          </form>
        </section>

        {/* Charity List */}
        <section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-7">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-white/40">
              Directory
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              All Charities
            </h2>
          </div>

          {loading ? (
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-white/50">
              Loading charities...
            </div>
          ) : charities.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-white/10 p-8 text-center text-white/45">
              No charities found.
            </div>
          ) : (
            <div className="mt-8 grid gap-5">
              {charities.map((charity) => (
                <div
                  key={charity.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.02] p-6"
                >
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xl font-semibold">
                          {charity.name}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            charity.active
                              ? "bg-emerald-400/10 text-emerald-300"
                              : "bg-white/10 text-white/45"
                          }`}
                        >
                          {charity.active
                            ? "Active"
                            : "Inactive"}
                        </span>

                        {charity.featured && (
                          <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300">
                            Featured
                          </span>
                        )}
                      </div>

                      <p className="mt-3 text-sm leading-6 text-white/50">
                        {charity.description ||
                          "No description added yet."}
                      </p>

                      <div className="mt-5 grid gap-4 text-sm md:grid-cols-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.15em] text-white/30">
                            Event
                          </p>

                          <p className="mt-1 text-white/70">
                            {charity.event_name ||
                              "No upcoming event"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-[0.15em] text-white/30">
                            Date
                          </p>

                          <p className="mt-1 text-white/70">
                            {charity.event_date
                              ? new Date(
                                  `${charity.event_date}T00:00:00`
                                ).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  }
                                )
                              : "—"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-[0.15em] text-white/30">
                            Location
                          </p>

                          <p className="mt-1 text-white/70">
                            {charity.event_location ||
                              "—"}
                          </p>
                        </div>
                      </div>

                      {charity.image_url && (
                        <div className="mt-5">
                          <p className="text-xs uppercase tracking-[0.15em] text-white/30">
                            Image
                          </p>

                          <a
                            href={charity.image_url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 block truncate text-sm text-emerald-300 hover:underline"
                          >
                            {charity.image_url}
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          startEdit(charity)
                        }
                        className="rounded-full border border-white/10 px-5 py-2.5 text-sm font-semibold transition hover:bg-white/10"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(charity.id)
                        }
                        disabled={
                          deletingId === charity.id
                        }
                        className="rounded-full border border-red-400/20 bg-red-400/10 px-5 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-400/20 disabled:opacity-50"
                      >
                        {deletingId === charity.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}