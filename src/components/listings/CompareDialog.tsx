"use client";

import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { getReferencePrice } from "@/lib/services/prices";
import { cn } from "@/lib/utils";
import type { Listing, MarketPrice } from "@/lib/types";

export interface CompareDialogProps {
    listings: Listing[];
    open: boolean;
    onOpenChange(open: boolean): void;
}

export function CompareDialog({
    listings,
    open,
    onOpenChange,
}: CompareDialogProps) {
    const { t } = useLanguage();
    const [referencePrices, setReferencePrices] = useState<Record<string, MarketPrice | null>>({});

    useEffect(() => {
        if (!open || listings.length === 0) return;
        let active = true;

        async function loadReferencePrices() {
            const crops = Array.from(new Set(listings.map((l) => l.crop.trim().toLowerCase())));
            const results = await Promise.all(
                crops.map(async (crop) => {
                    try {
                        const mp = await getReferencePrice(crop);
                        return [crop, mp] as const;
                    } catch {
                        return [crop, null] as const;
                    }
                })
            );
            if (active) {
                setReferencePrices(Object.fromEntries(results));
            }
        }

        loadReferencePrices();

        return () => {
            active = false;
        };
    }, [open, listings]);

    const minPrice = listings.length > 0 ? Math.min(...listings.map((l) => l.askingPrice)) : 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full sm:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto p-6">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">
                        {t("compareSelected")}
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        {t("compareSelected")}
                    </DialogDescription>
                </DialogHeader>

                {/* Horizontally scrollable comparison table */}
                <div className="w-full overflow-x-auto py-2">
                    <table className="w-full min-w-[550px] border-collapse text-base">
                        <thead>
                            <tr className="border-b border-border bg-muted/40">
                                <th className="p-3 text-left font-semibold text-muted-foreground w-1/4">
                                    {t("marketplaceTitle")}
                                </th>
                                {listings.map((listing) => (
                                    <th
                                        key={listing.id}
                                        className="p-3 text-left font-bold text-foreground min-w-[160px]"
                                    >
                                        {listing.crop}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {/* Crop & Variety */}
                            <tr className="border-b border-border">
                                <td className="p-3 font-medium text-muted-foreground align-top">
                                    {t("cropName")}
                                </td>
                                {listings.map((listing) => (
                                    <td key={listing.id} className="p-3 font-semibold text-foreground align-top">
                                        {listing.crop}
                                        {listing.variety ? ` (${listing.variety})` : ""}
                                    </td>
                                ))}
                            </tr>

                            {/* Price (lowest highlighted in green) */}
                            <tr className="border-b border-border">
                                <td className="p-3 font-medium text-muted-foreground align-top">
                                    {t("askingPrice")}
                                </td>
                                {listings.map((listing) => {
                                    const isLowest = listing.askingPrice === minPrice;
                                    return (
                                        <td
                                            key={listing.id}
                                            className={cn(
                                                "p-3 align-top transition-colors",
                                                isLowest && "bg-green-100 dark:bg-green-950/60 rounded-md"
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    "text-base font-semibold",
                                                    isLowest
                                                        ? "text-green-800 dark:text-green-300 font-bold"
                                                        : "text-foreground"
                                                )}
                                            >
                                                ₹{listing.askingPrice} {t("perUnit")} {listing.unit}
                                            </span>
                                        </td>
                                    );
                                })}
                            </tr>

                            {/* Quantity */}
                            <tr className="border-b border-border">
                                <td className="p-3 font-medium text-muted-foreground align-top">
                                    {t("quantity")}
                                </td>
                                {listings.map((listing) => (
                                    <td key={listing.id} className="p-3 text-foreground align-top">
                                        {listing.quantity} {listing.unit}
                                    </td>
                                ))}
                            </tr>

                            {/* Grade */}
                            <tr className="border-b border-border">
                                <td className="p-3 font-medium text-muted-foreground align-top">
                                    {t("grade")}
                                </td>
                                {listings.map((listing) => (
                                    <td key={listing.id} className="p-3 align-top">
                                        <Badge variant="secondary" className="px-2.5 py-1 text-sm font-semibold">
                                            {t("grade")}: {listing.grade}
                                        </Badge>
                                    </td>
                                ))}
                            </tr>

                            {/* Harvest Date */}
                            <tr className="border-b border-border">
                                <td className="p-3 font-medium text-muted-foreground align-top">
                                    {t("harvestDate")}
                                </td>
                                {listings.map((listing) => (
                                    <td key={listing.id} className="p-3 text-foreground align-top">
                                        {listing.harvestDate}
                                    </td>
                                ))}
                            </tr>

                            {/* Location */}
                            <tr className="border-b border-border">
                                <td className="p-3 font-medium text-muted-foreground align-top">
                                    {t("location")}
                                </td>
                                {listings.map((listing) => (
                                    <td key={listing.id} className="p-3 text-foreground align-top">
                                        {listing.location}
                                    </td>
                                ))}
                            </tr>

                            {/* Reference Price Range */}
                            <tr className="border-b border-border">
                                <td className="p-3 font-medium text-muted-foreground align-top">
                                    {t("referencePrice")}
                                </td>
                                {listings.map((listing) => {
                                    const ref = referencePrices[listing.crop.trim().toLowerCase()];
                                    return (
                                        <td key={listing.id} className="p-3 align-top">
                                            {ref ? (
                                                <div className="flex flex-col gap-1.5 items-start">
                                                    <span className="font-semibold text-foreground">
                                                        ₹{ref.minPrice} - ₹{ref.maxPrice} {t("perUnit")} kg
                                                    </span>
                                                    {ref.isSample && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {t("sampleData")}
                                                        </Badge>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        </tbody>
                    </table>
                </div>

                <DialogFooter className="mt-4">
                    <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={() => onOpenChange(false)}
                        className="min-h-12 px-6 text-base font-semibold"
                    >
                        {t("close")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
