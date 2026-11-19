"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Sprout, Scale, Inbox, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/StatCard";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useRequireRole } from "@/lib/auth/useRequireRole";
import { getListingsByFarmer, getListingById } from "@/lib/services/listings";
import { getOrdersForUser } from "@/lib/services/orders";
import { statusKey } from "@/lib/statusKeys";
import type { Listing, Order } from "@/lib/types";

interface RecentOrderItem {
    order: Order;
    crop: string;
}

export default function FarmerDashboardPage() {
    const { user, ready } = useRequireRole("farmer");
    const { t } = useLanguage();

    const [listings, setListings] = useState<Listing[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [recentOrders, setRecentOrders] = useState<RecentOrderItem[]>([]);

    useEffect(() => {
        if (!ready || !user) return;

        let mounted = true;

        async function loadData() {
            if (!user) return;
            const [farmerListings, userOrders] = await Promise.all([
                getListingsByFarmer(user.id),
                getOrdersForUser(user.id),
            ]);

            if (!mounted) return;

            setListings(farmerListings);
            setOrders(userOrders);

            const sortedOrders = [...userOrders]
                .sort(
                    (a, b) =>
                        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                )
                .slice(0, 5);

            const resolvedRecent = await Promise.all(
                sortedOrders.map(async (order) => {
                    const listing = await getListingById(order.listingId);
                    return {
                        order,
                        crop: listing?.crop || order.listingId,
                    };
                })
            );

            if (mounted) {
                setRecentOrders(resolvedRecent);
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

    const activeListings = listings.filter(
        (l) => l.isAvailable && l.quantity > 0
    );
    const activeListingsCount = activeListings.length;
    const availableStockCount = activeListings.reduce(
        (acc, l) => acc + l.quantity,
        0
    );
    const incomingOrdersCount = orders.filter(
        (o) => o.status === "requested"
    ).length;
    const completedSalesCount = orders.filter(
        (o) => o.status === "confirmed"
    ).length;

    return (
        <main className="mx-auto max-w-7xl px-4 py-8">
            <div className="flex flex-col gap-8">
                {/* Header and Add Crop CTA */}
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                            {t("farmerDashboard")}
                        </h1>
                        <p className="mt-1 text-base text-muted-foreground md:text-lg">
                            {t("hello")}, {user.name}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Button size="lg" variant="outline" asChild className="min-h-12 gap-2 px-6 text-base md:text-lg">
                            <Link href="/farmer/orders">
                                <span>{t("viewOrders")}</span>
                            </Link>
                        </Button>
                        <Button size="lg" asChild className="min-h-14 gap-2 px-6 text-lg">
                            <Link href="/farmer/listings/new">
                                <Plus className="size-6" />
                                <span>{t("addCrop")}</span>
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* 4 Stat Cards */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        label={t("activeListings")}
                        value={activeListingsCount}
                        icon={Sprout}
                    />
                    <StatCard
                        label={t("availableStock")}
                        value={availableStockCount}
                        icon={Scale}
                    />
                    <StatCard
                        label={t("incomingOrders")}
                        value={incomingOrdersCount}
                        icon={Inbox}
                    />
                    <StatCard
                        label={t("completedSales")}
                        value={completedSalesCount}
                        icon={CheckCircle2}
                    />
                </div>

                {/* Recent Activity */}
                <Card className="p-6">
                    <CardHeader className="mb-4 p-0">
                        <CardTitle className="text-xl font-bold">
                            {t("recentActivity")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {recentOrders.length === 0 ? (
                            <p className="py-6 text-center text-base text-muted-foreground">
                                {t("noActivity")}
                            </p>
                        ) : (
                            <div className="divide-y divide-border">
                                {recentOrders.map(({ order, crop }) => {
                                    const statusLabelKey = statusKey[order.status];
                                    return (
                                        <div
                                            key={order.id}
                                            className="flex flex-col justify-between gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-base font-semibold text-foreground">
                                                    {crop}
                                                </span>
                                                <span className="text-base text-muted-foreground">
                                                    {order.quantity}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="inline-flex items-center rounded-full bg-primary/15 px-3 py-1 text-sm font-medium text-primary">
                                                    {t(statusLabelKey)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
