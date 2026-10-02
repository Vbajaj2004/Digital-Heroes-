"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type Charity = {
  id: number;
  name: string;
  active: boolean;
  featured: boolean;
  description: string | null;
  image_url: string | null;
  event_name: string | null;
  event_date: string | null;
  event_location: string | null;
};

type CharityInput = {
  name: string;
  description: string;
  image_url: string;
  event_name: string;
  event_date: string;
  event_location: string;
  active: boolean;
  featured: boolean;
};

async function verifyAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in.");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || profile?.role !== "admin") {
    throw new Error("Admin access required.");
  }

  return supabase;
}

export async function getCharities(): Promise<Charity[]> {
  const supabase = await verifyAdmin();

  const { data, error } = await supabase
    .from("charities")
    .select(
      `
        id,
        name,
        active,
        featured,
        description,
        image_url,
        event_name,
        event_date,
        event_location
      `
    )
    .order("id", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Charity[];
}

export async function createCharity(input: CharityInput) {
  const supabase = await verifyAdmin();

  const name = input.name.trim();

  if (!name) {
    throw new Error("Charity name is required.");
  }

  const { error } = await supabase.from("charities").insert({
    name,
    description: input.description.trim() || null,
    image_url: input.image_url.trim() || null,
    event_name: input.event_name.trim() || null,
    event_date: input.event_date || null,
    event_location: input.event_location.trim() || null,
    active: input.active,
    featured: input.featured,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/charities");
  revalidatePath("/charities");
  revalidatePath("/");
}

export async function updateCharity(
  id: number,
  input: CharityInput
) {
  const supabase = await verifyAdmin();

  const name = input.name.trim();

  if (!name) {
    throw new Error("Charity name is required.");
  }

  const { error } = await supabase
    .from("charities")
    .update({
      name,
      description: input.description.trim() || null,
      image_url: input.image_url.trim() || null,
      event_name: input.event_name.trim() || null,
      event_date: input.event_date || null,
      event_location: input.event_location.trim() || null,
      active: input.active,
      featured: input.featured,
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/charities");
  revalidatePath("/charities");
  revalidatePath("/");
}

export async function deleteCharity(id: number) {
  const supabase = await verifyAdmin();

  const { error } = await supabase
    .from("charities")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(
      "This charity cannot be deleted because it may already be linked to a user. Deactivate it instead."
    );
  }

  revalidatePath("/admin/charities");
  revalidatePath("/charities");
  revalidatePath("/");
}