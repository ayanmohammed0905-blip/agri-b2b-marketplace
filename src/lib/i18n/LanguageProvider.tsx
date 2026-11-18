"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { Language } from "@/lib/types";
import { en, type Dictionary } from "./en";
import { kn } from "./kn";

interface LanguageContextValue {
    language: Language;
    setLanguage(lang: Language): void;
    t(key: keyof Dictionary): string;
}

const dictionaries: Record<Language, Dictionary> = {
    en,
    kn,
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguageState] = useState<Language>("en");

    useEffect(() => {
        try {
            const stored = localStorage.getItem("language");
            if (stored === "en" || stored === "kn") {
                setLanguageState(stored);
            }
        } catch { }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        try {
            localStorage.setItem("language", lang);
        } catch { }
    };

    useEffect(() => {
        document.documentElement.lang = language;
    }, [language]);

    const t = (key: keyof Dictionary): string => {
        return dictionaries[language][key] ?? en[key] ?? key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage(): LanguageContextValue {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
}
