"use client";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export default function Home() {
  const { t } = useLanguage();

  return (
    <main className="p-8 space-y-4">
      <div className="flex gap-2">
        <ThemeToggle />
        <LanguageSwitcher />
      </div>
      <h1 className="text-3xl font-bold">{t("appName")}</h1>
      <p className="text-lg">{t("welcome")}</p>
      <Button size="lg">{t("addCrop")}</Button>
    </main>
  );
}
