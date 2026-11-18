"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage();

    return (
        <div role="group" aria-label="Language" className="flex items-center gap-1">
            <Button
                size="sm"
                variant={language === "en" ? "default" : "outline"}
                onClick={() => setLanguage("en")}
            >
                English
            </Button>
            <Button
                size="sm"
                variant={language === "kn" ? "default" : "outline"}
                onClick={() => setLanguage("kn")}
            >
                ಕನ್ನಡ
            </Button>
        </div>
    );
}
