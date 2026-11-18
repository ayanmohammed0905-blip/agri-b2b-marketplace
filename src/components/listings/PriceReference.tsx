"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { getReferencePrice } from "@/lib/services/prices";
import type { MarketPrice } from "@/lib/types";

export interface PriceReferenceProps {
    crop: string;
    askingPrice: number;
}

export function PriceReference({ crop, askingPrice }: PriceReferenceProps) {
    const { t } = useLanguage();
    const [priceData, setPriceData] = useState<MarketPrice | null>(null);

    useEffect(() => {
        const trimmed = crop.trim();
        if (!trimmed) {
            setPriceData(null);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                const res = await getReferencePrice(trimmed);
                setPriceData(res);
            } catch {
                setPriceData(null);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [crop]);

    if (!crop.trim() || !priceData) {
        return null;
    }

    let statusLineKey: "priceBelow" | "priceWithin" | "priceAbove" | null = null;
    let statusColorClass = "";

    if (askingPrice > 0) {
        if (askingPrice < priceData.minPrice) {
            statusLineKey = "priceBelow";
            statusColorClass = "text-green-600 dark:text-green-400";
        } else if (askingPrice > priceData.maxPrice) {
            statusLineKey = "priceAbove";
            statusColorClass = "text-amber-600 dark:text-amber-400";
        } else {
            statusLineKey = "priceWithin";
            statusColorClass = "text-muted-foreground";
        }
    }

    return (
        <Card className="border-primary/20 bg-primary/5 p-4">
            <CardContent className="flex flex-col gap-2 p-0 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-foreground">
                        {t("referencePrice")}
                    </span>
                    {priceData.isSample && (
                        <Badge variant="outline" className="text-xs">
                            {t("sampleData")}
                        </Badge>
                    )}
                </div>

                <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-lg font-bold text-primary">
                        ₹{priceData.minPrice} - ₹{priceData.maxPrice}/kg
                    </span>
                    <span className="text-muted-foreground">({priceData.market})</span>
                </div>

                <p className="text-xs text-muted-foreground">
                    {t("reportedOn")} {priceData.reportedOn}
                </p>

                {askingPrice > 0 && statusLineKey && (
                    <div className="mt-1 border-t border-border/50 pt-2">
                        <p className="font-medium">
                            {t("yourPrice")}: ₹{askingPrice}
                        </p>
                        <p className={`font-medium ${statusColorClass}`}>
                            {t(statusLineKey)}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
