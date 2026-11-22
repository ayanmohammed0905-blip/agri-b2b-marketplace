import type { Profile, UserRole, Language } from "@/lib/types";

export interface ProfileRow {
    id: string;
    role: UserRole;
    name: string;
    phone: string;
    location: string;
    preferred_language: Language;
    business_name?: string | null;
}

export function profileFromRow(row: ProfileRow): Profile {
    return {
        id: row.id,
        role: row.role,
        name: row.name,
        phone: row.phone,
        location: row.location,
        preferredLanguage: row.preferred_language,
        ...(row.business_name ? { businessName: row.business_name } : {}),
    };
}
