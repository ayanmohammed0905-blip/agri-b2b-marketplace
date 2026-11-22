import type { Profile, UserRole, Language } from "@/lib/types";
import { mockProfiles } from "@/lib/mock/data";
import { getSupabase } from "@/lib/supabase/client";
import { profileFromRow, type ProfileRow } from "@/lib/supabase/mappers";

const USERS_KEY = "agri-users-v1";
const SESSION_KEY = "agri-session-v1";
const OVERRIDES_KEY = "agri-profile-overrides-v1";

function isSupabaseMode(): boolean {
    return process.env.NEXT_PUBLIC_BACKEND === "supabase";
}

function emailFromPhone(phone: string): string {
    return `${phone.trim()}@agri.local`;
}

function getStoredUsers(): Profile[] {
    try {
        const raw = localStorage.getItem(USERS_KEY);
        if (raw) {
            return JSON.parse(raw) as Profile[];
        }
    } catch { }
    return [];
}

function saveStoredUsers(users: Profile[]): void {
    try {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch { }
}

function getSessionId(): string | null {
    try {
        return localStorage.getItem(SESSION_KEY);
    } catch { }
    return null;
}

function saveSessionId(id: string): void {
    try {
        localStorage.setItem(SESSION_KEY, id);
    } catch { }
}

function clearSessionId(): void {
    try {
        localStorage.removeItem(SESSION_KEY);
    } catch { }
}

function getProfileOverrides(): Record<string, Partial<Profile>> {
    try {
        const raw = localStorage.getItem(OVERRIDES_KEY);
        if (raw) {
            return JSON.parse(raw) as Record<string, Partial<Profile>>;
        }
    } catch { }
    return {};
}

function saveProfileOverrides(overrides: Record<string, Partial<Profile>>): void {
    try {
        localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
    } catch { }
}

function applyOverride(profile: Profile): Profile {
    const overrides = getProfileOverrides();
    const override = overrides[profile.id];
    if (!override) {
        return { ...profile };
    }
    return {
        ...profile,
        ...override,
    };
}

function getAllUsers(): Profile[] {
    return [...mockProfiles, ...getStoredUsers()];
}

export interface RegisterInput {
    name: string;
    phone: string;
    location: string;
    role: UserRole;
    preferredLanguage: Language;
    businessName?: string;
    password?: string;
}

export async function login(phone: string, password?: string): Promise<Profile> {
    const trimmedPhone = phone.trim();

    if (!isSupabaseMode()) {
        const allUsers = getAllUsers();
        const user = allUsers.find((u) => u.phone === trimmedPhone);
        if (!user) {
            throw new Error("errNotFound");
        }
        const mergedUser = applyOverride(user);
        saveSessionId(mergedUser.id);
        return mergedUser;
    }

    const supabase = getSupabase();
    const email = emailFromPhone(trimmedPhone);

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: password || "",
    });

    if (error || !data.user) {
        throw new Error("errLogin");
    }

    const { data: profileRow, error: profileError } = await supabase
        .from("profiles")
        .select("id, role, name, phone, location, preferred_language, business_name")
        .eq("id", data.user.id)
        .single();

    if (profileError || !profileRow) {
        throw new Error("errLogin");
    }

    return profileFromRow(profileRow as ProfileRow);
}

export async function register(input: RegisterInput, password?: string): Promise<Profile> {
    const trimmedPhone = input.phone.trim();
    const pwd = password || input.password || "";

    if (!isSupabaseMode()) {
        const allUsers = getAllUsers();
        const exists = allUsers.some((u) => u.phone === trimmedPhone);
        if (exists) {
            throw new Error("errExists");
        }

        const newProfile: Profile = {
            id: `u${Date.now()}`,
            name: input.name.trim(),
            phone: trimmedPhone,
            location: input.location.trim(),
            role: input.role,
            preferredLanguage: input.preferredLanguage,
            ...(input.businessName ? { businessName: input.businessName.trim() } : {}),
        };

        const storedUsers = getStoredUsers();
        storedUsers.push(newProfile);
        saveStoredUsers(storedUsers);
        saveSessionId(newProfile.id);

        return newProfile;
    }

    const supabase = getSupabase();
    const email = emailFromPhone(trimmedPhone);

    const { data, error } = await supabase.auth.signUp({
        email,
        password: pwd,
        options: {
            data: {
                role: input.role,
                name: input.name.trim(),
                phone: trimmedPhone,
                location: input.location.trim(),
                preferred_language: input.preferredLanguage,
                business_name: input.businessName?.trim() || null,
            },
        },
    });

    if (error) {
        throw new Error("errExists");
    }

    if (!data.user || (data.user.identities && data.user.identities.length === 0)) {
        throw new Error("errExists");
    }

    const { data: profileRow, error: profileError } = await supabase
        .from("profiles")
        .select("id, role, name, phone, location, preferred_language, business_name")
        .eq("id", data.user.id)
        .single();

    if (profileError || !profileRow) {
        throw new Error(profileError?.message || "Failed to load profile");
    }

    return profileFromRow(profileRow as ProfileRow);
}

export async function getCurrentUser(): Promise<Profile | null> {
    if (!isSupabaseMode()) {
        const sessionId = getSessionId();
        if (!sessionId) {
            return null;
        }
        const allUsers = getAllUsers();
        const user = allUsers.find((u) => u.id === sessionId);
        if (!user) {
            return null;
        }
        return applyOverride(user);
    }

    const supabase = getSupabase();
    const {
        data: { session },
        error,
    } = await supabase.auth.getSession();

    if (error || !session?.user) {
        return null;
    }

    const { data: profileRow, error: profileError } = await supabase
        .from("profiles")
        .select("id, role, name, phone, location, preferred_language, business_name")
        .eq("id", session.user.id)
        .single();

    if (profileError || !profileRow) {
        return null;
    }

    return profileFromRow(profileRow as ProfileRow);
}

export async function updateProfile(
    id: string,
    changes: {
        name?: string;
        location?: string;
        preferredLanguage?: Language;
        businessName?: string;
    }
): Promise<Profile> {
    if (!isSupabaseMode()) {
        const allUsers = getAllUsers();
        const baseUser = allUsers.find((u) => u.id === id);
        if (!baseUser) {
            throw new Error("Profile not found");
        }

        const overrides = getProfileOverrides();
        const currentOverride = overrides[id] || {};

        const cleanChanges: Partial<Profile> = {};
        if (changes.name !== undefined) cleanChanges.name = changes.name.trim();
        if (changes.location !== undefined) cleanChanges.location = changes.location.trim();
        if (changes.preferredLanguage !== undefined) cleanChanges.preferredLanguage = changes.preferredLanguage;
        if (changes.businessName !== undefined) cleanChanges.businessName = changes.businessName.trim();

        const newOverride: Partial<Profile> = {
            ...currentOverride,
            ...cleanChanges,
        };

        overrides[id] = newOverride;
        saveProfileOverrides(overrides);

        return {
            ...baseUser,
            ...newOverride,
        };
    }

    const supabase = getSupabase();
    const updates: {
        name?: string;
        location?: string;
        preferred_language?: Language;
        business_name?: string | null;
    } = {};

    if (changes.name !== undefined) updates.name = changes.name.trim();
    if (changes.location !== undefined) updates.location = changes.location.trim();
    if (changes.preferredLanguage !== undefined) updates.preferred_language = changes.preferredLanguage;
    if (changes.businessName !== undefined) {
        const trimmed = changes.businessName.trim();
        updates.business_name = trimmed.length > 0 ? trimmed : null;
    }

    const { data: profileRow, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", id)
        .select("id, role, name, phone, location, preferred_language, business_name")
        .single();

    if (error || !profileRow) {
        throw new Error(error?.message || "Failed to update profile");
    }

    return profileFromRow(profileRow as ProfileRow);
}

export async function logout(): Promise<void> {
    if (!isSupabaseMode()) {
        clearSessionId();
        return;
    }

    const supabase = getSupabase();
    await supabase.auth.signOut();
}
