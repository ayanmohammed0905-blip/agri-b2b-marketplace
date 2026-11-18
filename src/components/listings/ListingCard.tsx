"use client";

import Link from "next/link";
import { Sprout, MapPin, User as UserIcon, Calendar, Square, CheckSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import type { Listing } from "@/lib/types";

export interface ListingCardProps {
    listing: Listing;
    farmerName?: string;
    selected?: boolean;
    onToggleCompare?: () => void;
}

export function ListingCard({
    listing,
    farmerName,
    selected = false,
    onToggleCompare,
}: ListingCardProps) {
    const { t } = useLanguage();

    return (
        <Card
            className={cn(
                "flex flex-col justify-between overflow-hidden transition-all text-base border-border",
                selected && "ring-2 ring-primary border-primary shadow-md"
            )}
        >
            <div className="flex flex-col">
                {/* Image area */}
                <div className="relative aspect-video w-full overflow-hidden bg-muted">
                    {listing.photos && listing.photos.length > 0 && listing.photos[0] ? (
                        <img
                            src={listing.photos[0]}
                            alt={listing.crop}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400">
                            <Sprout className="size-16" />
                        </div>
                    )}
                </div>

                {/* Main Card Content */}
                <CardContent className="flex flex-col gap-3 p-5">
                    {/* Crop + Variety & Grade Badge */}
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="text-xl font-bold tracking-tight text-foreground">
                            {listing.crop}
                            {listing.variety ? ` (${listing.variety})` : ""}
                        </h3>
                        <Badge variant="secondary" className="shrink-0 px-2.5 py-1 text-sm font-semibold">
                            {t("grade")}: {listing.grade}
                        </Badge>
                    </div>

                    {/* Price and Quantity */}
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="text-xl font-bold text-green-600 dark:text-green-500">
                            ₹{listing.askingPrice} {t("perUnit")} {listing.unit}
                        </span>
                        <span className="text-base font-medium text-muted-foreground">
                            {listing.quantity} {listing.unit}
                        </span>
                    </div>

                    {/* Location, Farmer, Harvest Date */}
                    <div className="flex flex-col gap-2 border-t border-border pt-3 text-base text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <MapPin className="size-5 shrink-0 text-primary" />
                            <span className="truncate">{listing.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <UserIcon className="size-5 shrink-0 text-primary" />
                            <span className="truncate">{farmerName || t("farmer")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="size-5 shrink-0 text-primary" />
                            <span className="truncate">
                                {t("harvestDate")}: {listing.harvestDate}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </div>

            {/* Actions: View Details and Compare button */}
            <div className="flex flex-col gap-2.5 p-5 pt-0">
                <Button
                    type="button"
                    variant={selected ? "default" : "outline"}
                    size="lg"
                    onClick={onToggleCompare}
                    className={cn(
                        "min-h-12 w-full text-base font-semibold gap-2 transition-colors",
                        selected && "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                >
                    {selected ? (
                        <CheckSquare className="size-5" />
                    ) : (
                        <Square className="size-5 text-muted-foreground" />
                    )}
                    <span>{t("compare")}</span>
                </Button>

                <Button asChild size="lg" className="min-h-12 w-full text-base font-semibold">
                    <Link href={`/buyer/marketplace/${listing.id}`}>
                        {t("viewDetails")}
                    </Link>
                </Button>
            </div>
        </Card>
    );
}
