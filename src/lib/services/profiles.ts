import type { Profile } from "@/lib/types";
import { mockProfiles } from "@/lib/mock/data";
import { getSupabase } from "@/lib/supabase/client";
import { profileFromRow, type ProfileRow } from "@/lib/supabase/mappers";

function isSupabaseMode(): boolean {
    return process.env.NEXT_PUBLIC_BACKEND === "supabase";
}

export async function getProfileById(id: string): Promise<Profile | null> {
    if (!isSupabaseMode()) {
        return mockProfiles.find((p) => p.id === id) ?? null;
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
        .from("profiles")
        .select("id, role, name, phone, location, preferred_language, business_name")
        .eq("id", id)
        .maybeSingle();

    if (error || !data) {
        return null;
    }

    return profileFromRow(data as ProfileRow);
}

export async function getAllProfiles(): Promise<Profile[]> {
    if (!isSupabaseMode()) {
        return mockProfiles;
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
        .from("profiles")
        .select("id, role, name, phone, location, preferred_language, business_name");

    if (error || !data) {
        return [];
    }

    return (data as ProfileRow[]).map(profileFromRow);
}
