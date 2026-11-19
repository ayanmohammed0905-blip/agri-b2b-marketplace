"use client";

import { useState } from "react";
import { useRequireRole } from "@/lib/auth/useRequireRole";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { ListingForm } from "@/components/listings/ListingForm";
import { VoiceListingPanel } from "@/components/voice/VoiceListingPanel";
import type { ParsedListing } from "@/lib/voice/parseListing";

export default function NewListingPage() {
    const { user, ready } = useRequireRole("farmer");
    const { t } = useLanguage();

    const [parsedFields, setParsedFields] = useState<ParsedListing>({});
    const [parseCounter, setParseCounter] = useState(0);

    const handleParsed = (fields: ParsedListing) => {
        setParsedFields(fields);
        setParseCounter((prev) => prev + 1);
    };

    if (!ready || !user) {
        return (
            <main className="mx-auto max-w-2xl px-4 py-12">
                <p className="text-base text-muted-foreground">{t("loading")}</p>
            </main>
        );
    }

    // Merge parsed fields over the form's normal defaults (crop, quantity, unit, askingPrice only)
    const formDefaults = {
        ...(parsedFields.crop ? { crop: parsedFields.crop } : {}),
        ...(parsedFields.quantity !== undefined ? { quantity: parsedFields.quantity } : {}),
        ...(parsedFields.unit ? { unit: parsedFields.unit } : {}),
        ...(parsedFields.askingPrice !== undefined ? { askingPrice: parsedFields.askingPrice } : {}),
    };

    return (
        <main className="mx-auto max-w-2xl px-4 py-8">
            <h1 className="mb-8 text-3xl font-bold tracking-tight md:text-4xl">
                {t("newListing")}
            </h1>
            <div className="flex flex-col gap-8">
                <VoiceListingPanel onParsed={handleParsed} />
                {/* Photos are cleared on remount. The farmer should add photos after using voice. */}
                <ListingForm key={parseCounter} defaultValues={formDefaults} />
            </div>
        </main>
    );
}
