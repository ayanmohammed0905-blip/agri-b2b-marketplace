// Mock auth service, will later call Supabase Auth.

import type { Profile, UserRole, Language } from "@/lib/types";
import { mockProfiles } from "@/lib/mock/data";

const USERS_KEY = "agri-users-v1";
const SESSION_KEY = "agri-session-v1";
const OVERRIDES_KEY = "agri-profile-overrides-v1";

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
}

export async function login(phone: string): Promise<Profile> {
    const trimmedPhone = phone.trim();
    const allUsers = getAllUsers();
    const user = allUsers.find((u) => u.phone === trimmedPhone);
    if (!user) {
        throw new Error("errNotFound");
    }
    const mergedUser = applyOverride(user);
    saveSessionId(mergedUser.id);
    return mergedUser;
}

export async function register(input: RegisterInput): Promise<Profile> {
    const trimmedPhone = input.phone.trim();
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

export async function getCurrentUser(): Promise<Profile | null> {
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

// Will later call Supabase Auth / Database
export async function updateProfile(
    id: string,
    changes: {
        name?: string;
        location?: string;
        preferredLanguage?: Language;
        businessName?: string;
    }
): Promise<Profile> {
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

export async function logout(): Promise<void> {
    clearSessionId();
}
