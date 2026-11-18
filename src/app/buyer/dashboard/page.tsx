"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Sprout, Clock, MapPin, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/StatCard";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useRequireRole } from "@/lib/auth/useRequireRole";
import { getListings, getListingById } from "@/lib/services/listings";
import { getOrdersForUser } from "@/lib/services/orders";
import { getProfileById } from "@/lib/services/profiles";
import { statusKey } from "@/lib/statusKeys";
import type { Listing, Order } from "@/lib/types";

export default function BuyerDashboardPage() {
    const { user, ready } = useRequireRole("buyer");
    const { t } = useLanguage();

    const [listings, setListings] = useState<Listing[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [farmersMap, setFarmersMap] = useState<Record<string, string>>({});
    const [cropsMap, setCropsMap] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!ready || !user) return;

        let mounted = true;

        async function loadData() {
            if (!user) return;
            const [availableListings, buyerOrders] = await Promise.all([
                getListings(),
                getOrdersForUser(user.id),
            ]);

            if (!mounted) return;

            setListings(availableListings);
            setOrders(buyerOrders);

            // Fetch farmer names for top 4 listings
            const top4 = availableListings.slice(0, 4);
            const farmerIds = Array.from(new Set(top4.map((l) => l.farmerId)));
            const farmerEntries = await Promise.all(
                farmerIds.map(async (fid) => {
                    const profile = await getProfileById(fid);
                    return [fid, profile?.name ?? ""] as const;
                })
            );

            // Fetch crop names for buyer orders
            const listingIds = Array.from(new Set(buyerOrders.map((o) => o.listingId)));
            const cropEntries = await Promise.all(
                listingIds.map(async (lid) => {
                    const listing = await getListingById(lid);
                    return [lid, listing?.crop ?? ""] as const;
                })
            );

            if (mounted) {
                setFarmersMap(Object.fromEntries(farmerEntries));
                setCropsMap(Object.fromEntries(cropEntries));
            }
        }

        loadData();

        return () => {
            mounted = false;
        };
    }, [ready, user]);

    if (!ready || !user) {
        return (
            <main className="mx-auto max-w-7xl px-4 py-12">
                <p className="text-base text-muted-foreground">{t("loading")}</p>
            </main>
        );
    }

    const availableProduceCount = listings.length;
    const pendingOrdersCount = orders.filter(
        (o) => o.status !== "confirmed" && o.status !== "rejected"
    ).length;

    const recentListings = listings.slice(0, 4);

    return (
        <main className="mx-auto max-w-7xl px-4 py-8">
            <div className="flex flex-col gap-8">
                {/* Header and Browse Market CTA */}
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                            {t("buyerDashboard")}
                        </h1>
                        <p className="mt-1 text-base text-muted-foreground md:text-lg">
                            {t("hello")}, {user.name}
                            {user.businessName ? ` (${user.businessName})` : ""}
                        </p>
                    </div>
                    <Button size="lg" asChild className="min-h-14 gap-2 px-6 text-lg">
                        <Link href="/buyer/marketplace">
                            <Search className="size-6" />
                            <span>{t("browseMarket")}</span>
                        </Link>
                    </Button>
                </div>

                {/* 2 Stat Cards */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <StatCard
                        label={t("availableProduce")}
                        value={availableProduceCount}
                        icon={Sprout}
                    />
                    <StatCard
                        label={t("pendingOrders")}
                        value={pendingOrdersCount}
                        icon={Clock}
                    />
                </div>

                {/* Recent Listings */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold tracking-tight">
                        {t("recentListings")}
                    </h2>
                    {recentListings.length === 0 ? (
                        <Card className="p-8 text-center">
                            <p className="text-base text-muted-foreground">
                                {t("noListings")}
                            </p>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {recentListings.map((listing) => {
                                const farmerName = farmersMap[listing.farmerId] || "";
                                return (
                                    <Link
                                        key={listing.id}
                                        href={`/buyer/marketplace/${listing.id}`}
                                        className="group block focus:outline-none"
                                    >
                                        <Card className="h-full p-5 transition-all group-hover:border-primary/50">
                                            <CardHeader className="mb-2 p-0">
                                                <CardTitle className="text-lg font-bold">
                                                    {listing.crop}
                                                    {listing.variety ? ` (${listing.variety})` : ""}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="flex flex-col gap-2 p-0 text-base">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-semibold text-primary">
                                                        ₹{listing.askingPrice}/{listing.unit}
                                                    </span>
                                                    <span className="text-muted-foreground">
                                                        {listing.quantity} {listing.unit}
                                                    </span>
                                                </div>

                                                <div className="mt-2 flex flex-col gap-1 border-t border-border pt-2 text-sm text-muted-foreground">
                                                    <div className="flex items-center gap-1.5">
                                                        <MapPin className="size-4 shrink-0 text-primary" />
                                                        <span className="truncate">{listing.location}</span>
                                                    </div>
                                                    {farmerName && (
                                                        <div className="flex items-center gap-1.5">
                                                            <UserIcon className="size-4 shrink-0 text-primary" />
                                                            <span className="truncate">{farmerName}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Order History */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold tracking-tight">
                        {t("orderHistory")}
                    </h2>
                    {orders.length === 0 ? (
                        <Card className="p-8 text-center">
                            <p className="text-base text-muted-foreground">
                                {t("noOrders")}
                            </p>
                        </Card>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {orders.map((order) => {
                                const crop = cropsMap[order.listingId] || order.listingId;
                                const statusLabelKey = statusKey[order.status];
                                return (
                                    <Link
                                        key={order.id}
                                        href={`/orders/${order.id}`}
                                        className="group block focus:outline-none"
                                    >
                                        <Card className="p-5 transition-all group-hover:border-primary/50">
                                            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                                                <div className="flex flex-wrap items-center gap-4 text-base">
                                                    <span className="font-semibold text-foreground">
                                                        {crop}
                                                    </span>
                                                    <span className="text-muted-foreground">
                                                        {order.quantity}
                                                    </span>
                                                    <span className="font-medium text-foreground">
                                                        ₹{order.agreedPrice}
                                                    </span>
                                                </div>
                                                <div>
                                                    <Badge
                                                        variant="secondary"
                                                        className="px-3 py-1 text-sm font-medium"
                                                    >
                                                        {t(statusLabelKey)}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </Card>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
