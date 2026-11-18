import type { Profile } from "@/lib/types";
import { mockProfiles } from "@/lib/mock/data";

export async function getProfileById(id: string): Promise<Profile | null> {
    return mockProfiles.find((p) => p.id === id) ?? null;
}

export async function getAllProfiles(): Promise<Profile[]> {
    return mockProfiles;
}