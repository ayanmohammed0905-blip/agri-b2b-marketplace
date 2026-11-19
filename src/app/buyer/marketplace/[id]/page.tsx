"use client";

import { Suspense, use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, MapPin, Sprout, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PriceReference } from "@/components/listings/PriceReference";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useRequireRole } from "@/lib/auth/useRequireRole";
import { getListingById } from "@/lib/services/listings";
import { getProfileById } from "@/lib/services/profiles";
import { placeOrder } from "@/lib/services/orders";
import type { Listing, Profile } from "@/lib/types";

interface PageProps {
    params: Promise<{ id: string }>;
}

function CropDetailsFallback() {
    const { t } = useLanguage();
    return (
        <main className="mx-auto max-w-7xl px-4 py-12">
            <p className="text-base text-muted-foreground">{t("loading")}</p>
        </main>
    );
}

function CropDetailsContent({ params }: PageProps) {
    const { id } = use(params);
    const { user, ready } = useRequireRole("buyer");
    const { t } = useLanguage();
    const router = useRouter();

    const [listing, setListing] = useState<Listing | null>(null);
    const [farmer, setFarmer] = useState<Profile | null>(null);
    const [loadingListing, setLoadingListing] = useState(true);

    const [quantityInput, setQuantityInput] = useState("1");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!ready || !id) return;
        let active = true;

        async function loadListingAndFarmer() {
            setLoadingListing(true);
            try {
                const item = await getListingById(id);
                if (!active) return;
                setListing(item);

                if (item?.farmerId) {
                    const farmerProfile = await getProfileById(item.farmerId);
                    if (active) {
                        setFarmer(farmerProfile);
                    }
                }
            } catch {
                if (active) {
                    setListing(null);
                }
            } finally {
                if (active) {
                    setLoadingListing(false);
                }
            }
        }

        loadListingAndFarmer();

        return () => {
            active = false;
        };
    }, [ready, id]);

    if (!ready || !user || loadingListing) {
        return (
            <main className="mx-auto max-w-7xl px-4 py-12">
                <p className="text-base text-muted-foreground">{t("loading")}</p>
            </main>
        );
    }

    if (!listing || !listing.isAvailable || listing.quantity <= 0) {
        return (
            <main className="mx-auto max-w-7xl px-4 py-8">
                <div className="flex flex-col gap-6">
                    <div>
                        <Button variant="ghost" asChild className="min-h-12 text-base font-medium gap-2">
                            <Link href="/buyer/marketplace">
                                <ArrowLeft className="size-5" />
                                <span>{t("backToMarket")}</span>
                            </Link>
                        </Button>
                    </div>
                    <Card className="p-12 text-center">
                        <CardContent className="flex flex-col items-center gap-4 p-0">
                            <p className="text-xl font-medium text-muted-foreground">
                                {t("listingNotFound")}
                            </p>
                            <Button asChild size="lg" className="min-h-12 px-6 text-base font-semibold">
                                <Link href="/buyer/marketplace">
                                    {t("backToMarket")}
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </main>
        );
    }

    const numQty = Number(quantityInput);
    let validationError: "errOrderQty" | "errStock" | null = null;
    if (!quantityInput.trim() || isNaN(numQty) || numQty <= 0) {
        validationError = "errOrderQty";
    } else if (numQty > listing.quantity) {
        validationError = "errStock";
    }

    const totalPrice = !validationError ? numQty * listing.askingPrice : 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (validationError || !user || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const order = await placeOrder({
                listingId: listing.id,
                buyerId: user.id,
                quantity: numQty,
            });
            toast.success(t("orderPlaced"));
            router.push(`/orders/${order.id}`);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="mx-auto max-w-7xl px-4 py-8 pb-16">
            <div className="flex flex-col gap-6">
                {/* Back to marketplace link */}
                <div>
                    <Button variant="ghost" asChild className="min-h-12 text-base font-medium gap-2 px-0 hover:bg-transparent">
                        <Link href="/buyer/marketplace">
                            <ArrowLeft className="size-5" />
                            <span>{t("backToMarket")}</span>
                        </Link>
                    </Button>
                </div>

                {/* Two columns on lg, stacked on mobile */}
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                    {/* Left column */}
                    <div className="flex flex-col gap-6">
                        {/* Image */}
                        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted border border-border">
                            {listing.photos && listing.photos.length > 0 && listing.photos[0] ? (
                                <img
                                    src={listing.photos[0]}
                                    alt={listing.crop}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400">
                                    <Sprout className="size-20" />
                                </div>
                            )}
                        </div>

                        {/* Title & Grade Badge */}
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                                {listing.crop}
                                {listing.variety ? ` (${listing.variety})` : ""}
                            </h1>
                            <Badge variant="secondary" className="px-3 py-1.5 text-base font-semibold">
                                {t("grade")}: {listing.grade}
                            </Badge>
                        </div>

                        {/* Details: Harvest date, Location, Farmer info */}
                        <div className="flex flex-col gap-3 border-t border-border pt-4 text-base text-muted-foreground">
                            <div className="flex items-center gap-2.5">
                                <Calendar className="size-5 shrink-0 text-primary" />
                                <span>
                                    {t("harvestDate")}: {listing.harvestDate}
                                </span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <MapPin className="size-5 shrink-0 text-primary" />
                                <span>{listing.location}</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <UserIcon className="size-5 shrink-0 text-primary" />
                                <span>
                                    {farmer ? (
                                        <>
                                            <span className="font-semibold text-foreground">{farmer.name}</span>
                                            {farmer.location && <span> • {farmer.location}</span>}
                                        </>
                                    ) : (
                                        <span>{t("farmerInfo")}</span>
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right column: Card with Price, Available stock, PriceReference, and Order form */}
                    <div>
                        <Card className="p-6">
                            <CardContent className="flex flex-col gap-6 p-0">
                                {/* Price */}
                                <div className="text-3xl font-bold text-green-600 dark:text-green-500">
                                    ₹{listing.askingPrice} {t("perUnit")} {listing.unit}
                                </div>

                                {/* Available stock */}
                                <div className="text-lg font-medium text-muted-foreground">
                                    {t("available")}: {listing.quantity} {listing.unit}
                                </div>

                                {/* Price Reference component */}
                                <PriceReference
                                    crop={listing.crop}
                                    askingPrice={listing.askingPrice}
                                />

                                {/* Order Form */}
                                <form onSubmit={handleSubmit} className="flex flex-col gap-5 border-t border-border pt-6">
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="orderQuantity" className="text-base font-medium">
                                            {t("orderQuantity")} ({listing.unit})
                                        </Label>
                                        <Input
                                            id="orderQuantity"
                                            type="number"
                                            min="1"
                                            max={listing.quantity}
                                            step="any"
                                            value={quantityInput}
                                            onChange={(e) => setQuantityInput(e.target.value)}
                                            className="min-h-12 text-base"
                                        />
                                        {validationError && (
                                            <p className="text-sm font-medium text-destructive">
                                                {t(validationError)}
                                            </p>
                                        )}
                                    </div>

                                    {/* Live total */}
                                    <div className="flex items-center justify-between border-t border-border pt-4">
                                        <span className="text-base font-semibold text-muted-foreground">
                                            {t("totalPrice")}
                                        </span>
                                        <span className="text-2xl font-bold text-foreground">
                                            ₹{totalPrice}
                                        </span>
                                    </div>

                                    {/* Submit button */}
                                    <Button
                                        type="submit"
                                        size="lg"
                                        disabled={isSubmitting || Boolean(validationError)}
                                        className="min-h-12 w-full text-lg font-bold"
                                    >
                                        {isSubmitting ? t("loading") : t("placeOrder")}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default function CropDetailsPage({ params }: PageProps) {
    return (
        <Suspense fallback={<CropDetailsFallback />}>
            <CropDetailsContent params={params} />
        </Suspense>
    );
}
