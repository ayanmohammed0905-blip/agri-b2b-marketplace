"use client";

import { useRequireRole } from "@/lib/auth/useRequireRole";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { ListingForm } from "@/components/listings/ListingForm";

export default function NewListingPage() {
    const { user, ready } = useRequireRole("farmer");
    const { t } = useLanguage();

    if (!ready || !user) {
        return (
            <main className="mx-auto max-w-2xl px-4 py-12">
                <p className="text-base text-muted-foreground">{t("loading")}</p>
            </main>
        );
    }

    return (
        <main className="mx-auto max-w-2xl px-4 py-8">
            <h1 className="mb-8 text-3xl font-bold tracking-tight md:text-4xl">
                {t("newListing")}
            </h1>
            <ListingForm />
        </main>
    );
}
