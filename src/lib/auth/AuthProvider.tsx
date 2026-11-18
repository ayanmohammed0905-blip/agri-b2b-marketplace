"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { Profile, UserRole } from "@/lib/types";
import {
    login as authLogin,
    register as authRegister,
    getCurrentUser,
    logout as authLogout,
    type RegisterInput,
} from "@/lib/services/auth";

export interface AuthContextValue {
    user: Profile | null;
    loading: boolean;
    login(phone: string): Promise<Profile>;
    register(input: RegisterInput): Promise<Profile>;
    logout(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<Profile | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        let mounted = true;
        getCurrentUser()
            .then((currentUser) => {
                if (mounted) {
                    setUser(currentUser);
                    setLoading(false);
                }
            })
            .catch(() => {
                if (mounted) {
                    setUser(null);
                    setLoading(false);
                }
            });

        return () => {
            mounted = false;
        };
    }, []);

    const login = async (phone: string): Promise<Profile> => {
        const profile = await authLogin(phone);
        setUser(profile);
        return profile;
    };

    const register = async (input: RegisterInput): Promise<Profile> => {
        const profile = await authRegister(input);
        setUser(profile);
        return profile;
    };

    const logout = async (): Promise<void> => {
        await authLogout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

export function homePathForRole(role: UserRole): string {
    return role === "farmer" ? "/farmer/dashboard" : "/buyer/dashboard";
}
