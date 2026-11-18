"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export default function Home() {
  const { t } = useLanguage();

  return (
    <main className="p-8 space-y-4">
      <h1 className="text-3xl font-bold">{t("appName")}</h1>
      <p className="text-lg">{t("welcome")}</p>
      <Button size="lg">{t("addCrop")}</Button>
    </main>
  );
}
