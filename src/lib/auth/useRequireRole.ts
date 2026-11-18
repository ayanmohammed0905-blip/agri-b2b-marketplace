"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, homePathForRole } from "@/lib/auth/AuthProvider";
import type { Profile, UserRole } from "@/lib/types";

export function useRequireRole(role: UserRole): { user: Profile | null; ready: boolean } {
    const { user, loading } = useAuth();
    const router = useRouter();

    const ready = !loading && user !== null && user.role === role;

    useEffect(() => {
        if (loading) return;

        if (!user) {
            router.replace("/login");
            return;
        }

        if (user.role !== role) {
            router.replace(homePathForRole(user.role));
        }
    }, [user, loading, role, router]);

    return { user, ready };
}
