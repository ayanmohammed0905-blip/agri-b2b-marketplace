"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { OrderCard } from "@/components/orders/OrderCard";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useRequireRole } from "@/lib/auth/useRequireRole";
import { getOrdersForUser } from "@/lib/services/orders";
import { getProfileById } from "@/lib/services/profiles";
import { getListingById } from "@/lib/services/listings";
import type { Order } from "@/lib/types";

export default function BuyerOrdersPage() {
    const { user, ready } = useRequireRole("buyer");
    const { t } = useLanguage();

    const [orders, setOrders] = useState<Order[]>([]);
    const [farmerNames, setFarmerNames] = useState<Record<string, string>>({});
    const [cropNames, setCropNames] = useState<Record<string, string>>({});
    const [loadingOrders, setLoadingOrders] = useState(true);

    useEffect(() => {
        if (!ready || !user) return;
        let active = true;

        async function loadOrdersData() {
            setLoadingOrders(true);
            try {
                if (!user) return;
                const userOrders = await getOrdersForUser(user.id);
                if (!active) return;

                const buyerOrders = userOrders.filter((o) => o.buyerId === user.id);

                // Sort newest first
                const sorted = [...buyerOrders].sort((a, b) => {
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                });

                setOrders(sorted);

                // Fetch farmer names
                const farmerIds = Array.from(new Set(sorted.map((o) => o.farmerId)));
                const farmerEntries = await Promise.all(
                    farmerIds.map(async (fid) => {
                        const prof = await getProfileById(fid);
                        return [fid, prof?.name ?? ""] as const;
                    })
                );

                // Fetch crop names
                const listingIds = Array.from(new Set(sorted.map((o) => o.listingId)));
                const cropEntries = await Promise.all(
                    listingIds.map(async (lid) => {
                        const lst = await getListingById(lid);
                        return [lid, lst?.crop ?? ""] as const;
                    })
                );

                if (active) {
                    setFarmerNames(Object.fromEntries(farmerEntries));
                    setCropNames(Object.fromEntries(cropEntries));
                }
            } catch {
                if (active) {
                    setOrders([]);
                }
            } finally {
                if (active) {
                    setLoadingOrders(false);
                }
            }
        }

        loadOrdersData();

        return () => {
            active = false;
        };
    }, [ready, user]);

    if (!ready || !user || loadingOrders) {
        return (
            <main className="mx-auto max-w-7xl px-4 py-12">
                <p className="text-base text-muted-foreground">{t("loading")}</p>
            </main>
        );
    }

    return (
        <main className="mx-auto max-w-7xl px-4 py-8 pb-16">
            <div className="flex flex-col gap-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                        {t("buyerOrdersTitle")}
                    </h1>
                </div>

                {orders.length === 0 ? (
                    <Card className="p-12 text-center">
                        <p className="text-lg font-medium text-muted-foreground">
                            {t("noOrders")}
                        </p>
                    </Card>
                ) : (
                    <div className="flex flex-col gap-4">
                        {orders.map((order) => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                cropName={cropNames[order.listingId] || order.listingId}
                                otherPartyName={farmerNames[order.farmerId] || t("farmerInfo")}
                                href={`/orders/${order.id}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
