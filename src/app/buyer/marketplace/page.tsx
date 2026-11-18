"use client";

import { useEffect, useState } from "react";
import { FilterX } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ListingCard } from "@/components/listings/ListingCard";
import { CompareDialog } from "@/components/listings/CompareDialog";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useRequireRole } from "@/lib/auth/useRequireRole";
import { getListings, type ListingFilters } from "@/lib/services/listings";
import { getProfileById } from "@/lib/services/profiles";
import type { Listing } from "@/lib/types";

export default function BuyerMarketplacePage() {
    const { user, ready } = useRequireRole("buyer");
    const { t } = useLanguage();

    // Listings & reference state
    const [listings, setListings] = useState<Listing[]>([]);
    const [allLocations, setAllLocations] = useState<string[]>([]);
    const [allListingsMap, setAllListingsMap] = useState<Record<string, Listing>>({});
    const [farmersMap, setFarmersMap] = useState<Record<string, string>>({});

    // Filter state
    const [search, setSearch] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [minQuantity, setMinQuantity] = useState("");
    const [selectedLocation, setSelectedLocation] = useState("all");

    // Debounced values
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [debouncedMaxPrice, setDebouncedMaxPrice] = useState("");
    const [debouncedMinQuantity, setDebouncedMinQuantity] = useState("");

    // Compare selection state (max 3)
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isCompareOpen, setIsCompareOpen] = useState(false);

    // Initial load for distinct locations and cache all listings
    useEffect(() => {
        if (!ready) return;
        let active = true;

        async function loadInitialData() {
            const all = await getListings();
            if (!active) return;

            const locs = Array.from(
                new Set(all.map((l) => l.location.trim()).filter(Boolean))
            ).sort();
            setAllLocations(locs);

            const map: Record<string, Listing> = {};
            all.forEach((l) => {
                map[l.id] = l;
            });
            setAllListingsMap(map);
        }

        loadInitialData();

        return () => {
            active = false;
        };
    }, [ready]);

    // Debounce text and number inputs ~300ms
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setDebouncedMaxPrice(maxPrice);
            setDebouncedMinQuantity(minQuantity);
        }, 300);

        return () => clearTimeout(timer);
    }, [search, maxPrice, minQuantity]);

    // Apply filters when debounced inputs or location change
    useEffect(() => {
        if (!ready) return;
        let active = true;

        async function fetchFilteredListings() {
            const filters: ListingFilters = {};

            if (debouncedSearch.trim()) {
                filters.search = debouncedSearch.trim();
            }

            const parsedMax = debouncedMaxPrice ? Number(debouncedMaxPrice) : undefined;
            if (parsedMax !== undefined && !isNaN(parsedMax) && parsedMax > 0) {
                filters.maxPrice = parsedMax;
            }

            const parsedMinQty = debouncedMinQuantity ? Number(debouncedMinQuantity) : undefined;
            if (parsedMinQty !== undefined && !isNaN(parsedMinQty) && parsedMinQty > 0) {
                filters.minQuantity = parsedMinQty;
            }

            if (selectedLocation && selectedLocation !== "all") {
                filters.location = selectedLocation;
            }

            const results = await getListings(filters);
            if (!active) return;

            setListings(results);

            // Also keep allListingsMap populated with loaded listings
            setAllListingsMap((prev) => {
                const updated = { ...prev };
                results.forEach((l) => {
                    updated[l.id] = l;
                });
                return updated;
            });
        }

        fetchFilteredListings();

        return () => {
            active = false;
        };
    }, [ready, debouncedSearch, debouncedMaxPrice, debouncedMinQuantity, selectedLocation]);

    // Load farmer names for currently visible listings
    useEffect(() => {
        if (!ready || listings.length === 0) return;
        let active = true;

        async function loadFarmerNames() {
            const farmerIds = Array.from(new Set(listings.map((l) => l.farmerId)));
            const entries = await Promise.all(
                farmerIds.map(async (fid) => {
                    try {
                        const profile = await getProfileById(fid);
                        return [fid, profile?.name ?? ""] as const;
                    } catch {
                        return [fid, ""] as const;
                    }
                })
            );

            if (active) {
                setFarmersMap((prev) => ({
                    ...prev,
                    ...Object.fromEntries(entries),
                }));
            }
        }

        loadFarmerNames();

        return () => {
            active = false;
        };
    }, [ready, listings]);

    const handleClearFilters = () => {
        setSearch("");
        setMaxPrice("");
        setMinQuantity("");
        setSelectedLocation("all");
        setDebouncedSearch("");
        setDebouncedMaxPrice("");
        setDebouncedMinQuantity("");
    };

    const handleToggleCompare = (id: string) => {
        setSelectedIds((prev) => {
            if (prev.includes(id)) {
                return prev.filter((item) => item !== id);
            }
            if (prev.length >= 3) {
                // Ignore extra beyond 3
                return prev;
            }
            return [...prev, id];
        });
    };

    if (!ready || !user) {
        return (
            <main className="mx-auto max-w-7xl px-4 py-12">
                <p className="text-base text-muted-foreground">{t("loading")}</p>
            </main>
        );
    }

    const selectedListings = selectedIds
        .map((id) => allListingsMap[id] ?? listings.find((l) => l.id === id))
        .filter((l): l is Listing => Boolean(l));

    return (
        <main className="mx-auto max-w-7xl px-4 py-8 pb-28">
            <div className="flex flex-col gap-8">
                {/* Heading */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                        {t("marketplaceTitle")}
                    </h1>
                </div>

                {/* Filter bar in a Card */}
                <Card className="p-5">
                    <CardContent className="p-0">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 items-end">
                            {/* Search crop name */}
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="searchCrop" className="text-base font-medium">
                                    {t("searchCrop")}
                                </Label>
                                <Input
                                    id="searchCrop"
                                    type="text"
                                    placeholder={t("searchCrop")}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="min-h-12 text-base"
                                />
                            </div>

                            {/* Max price */}
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="maxPrice" className="text-base font-medium">
                                    {t("maxPrice")}
                                </Label>
                                <Input
                                    id="maxPrice"
                                    type="number"
                                    min="0"
                                    step="any"
                                    placeholder={t("maxPrice")}
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(e.target.value)}
                                    className="min-h-12 text-base"
                                />
                            </div>

                            {/* Min quantity */}
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="minQuantity" className="text-base font-medium">
                                    {t("minQuantity")}
                                </Label>
                                <Input
                                    id="minQuantity"
                                    type="number"
                                    min="0"
                                    step="any"
                                    placeholder={t("minQuantity")}
                                    value={minQuantity}
                                    onChange={(e) => setMinQuantity(e.target.value)}
                                    className="min-h-12 text-base"
                                />
                            </div>

                            {/* Location select */}
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="locationSelect" className="text-base font-medium">
                                    {t("location")}
                                </Label>
                                <Select
                                    value={selectedLocation}
                                    onValueChange={(val) => setSelectedLocation(val)}
                                >
                                    <SelectTrigger
                                        id="locationSelect"
                                        className="min-h-12 w-full text-base"
                                    >
                                        <SelectValue placeholder={t("allLocations")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all" className="text-base py-2">
                                            {t("allLocations")}
                                        </SelectItem>
                                        {allLocations.map((loc) => (
                                            <SelectItem key={loc} value={loc} className="text-base py-2">
                                                {loc}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Clear filters button */}
                            <Button
                                type="button"
                                variant="outline"
                                size="lg"
                                onClick={handleClearFilters}
                                className="min-h-12 text-base font-medium gap-2"
                            >
                                <FilterX className="size-5" />
                                <span>{t("clearFilters")}</span>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Results count & hint */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-base font-semibold text-muted-foreground">
                        {listings.length} {t("resultsCount")}
                    </p>
                    {selectedIds.length < 2 && (
                        <p className="text-sm font-medium text-muted-foreground">
                            {t("selectUpToThree")}
                        </p>
                    )}
                </div>

                {/* Responsive grid of ListingCards or Empty State */}
                {listings.length === 0 ? (
                    <Card className="p-12 text-center">
                        <p className="text-lg font-medium text-muted-foreground">
                            {t("noListings")}
                        </p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {listings.map((listing) => (
                            <ListingCard
                                key={listing.id}
                                listing={listing}
                                farmerName={farmersMap[listing.farmerId]}
                                selected={selectedIds.includes(listing.id)}
                                onToggleCompare={() => handleToggleCompare(listing.id)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Sticky bottom bar when 2 or 3 listings are selected */}
            {selectedIds.length >= 2 && (
                <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 p-4 shadow-lg backdrop-blur">
                    <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
                        <div className="text-base font-semibold text-foreground">
                            <span>{selectedIds.length} / 3</span>
                        </div>
                        <Button
                            type="button"
                            size="lg"
                            onClick={() => setIsCompareOpen(true)}
                            className="min-h-12 px-6 text-base font-bold shadow-sm"
                        >
                            {t("compareSelected")} ({selectedIds.length})
                        </Button>
                    </div>
                </div>
            )}

            {/* Compare dialog */}
            <CompareDialog
                open={isCompareOpen}
                onOpenChange={setIsCompareOpen}
                listings={selectedListings}
            />
        </main>
    );
}
