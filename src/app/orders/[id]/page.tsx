"use client";

import { Suspense, use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, User } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusStepper } from "@/components/orders/StatusStepper";
import { useAuth, homePathForRole } from "@/lib/auth/AuthProvider";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { statusKey } from "@/lib/statusKeys";
import { getOrderById, updateOrderStatus } from "@/lib/services/orders";
import { getListingById } from "@/lib/services/listings";
import { getProfileById } from "@/lib/services/profiles";
import { cn } from "@/lib/utils";
import type { Order, OrderStatus, Listing, Profile } from "@/lib/types";

interface PageProps {
    params: Promise<{ id: string }>;
}

function getStatusBadgeStyle(status: OrderStatus): string {
    switch (status) {
        case "requested":
            return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800";
        case "accepted":
        case "pickup_scheduled":
        case "picked_up":
        case "in_transit":
        case "delivered":
            return "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300 border border-green-200 dark:border-green-800";
        case "rejected":
            return "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800";
        case "confirmed":
            return "border-2 border-green-600 text-green-700 dark:text-green-400 bg-transparent";
        default:
            return "";
    }
}

function OrderDetailsFallback() {
    const { t } = useLanguage();
    return (
        <main className="mx-auto max-w-7xl px-4 py-12">
            <p className="text-base text-muted-foreground">{t("loading")}</p>
        </main>
    );
}

function OrderDetailsContent({ params }: PageProps) {
    const { id } = use(params);
    const { user, loading } = useAuth();
    const { t } = useLanguage();
    const router = useRouter();

    const [order, setOrder] = useState<Order | null>(null);
    const [listing, setListing] = useState<Listing | null>(null);
    const [buyer, setBuyer] = useState<Profile | null>(null);
    const [farmer, setFarmer] = useState<Profile | null>(null);
    const [loadingData, setLoadingData] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.replace("/login");
        }
    }, [user, loading, router]);

    const loadOrderData = useCallback(async () => {
        if (!id) return;
        setLoadingData(true);
        try {
            const ord = await getOrderById(id);
            setOrder(ord);
            if (ord) {
                const [lst, bProfile, fProfile] = await Promise.all([
                    getListingById(ord.listingId),
                    getProfileById(ord.buyerId),
                    getProfileById(ord.farmerId),
                ]);
                setListing(lst ?? ord.listing ?? null);
                setBuyer(bProfile ?? ord.buyer ?? null);
                setFarmer(fProfile ?? ord.farmer ?? null);
            }
        } catch {
            setOrder(null);
        } finally {
            setLoadingData(false);
        }
    }, [id]);

    useEffect(() => {
        if (!user) return;
        loadOrderData();
    }, [user, loadOrderData]);

    if (loading || !user || loadingData) {
        return (
            <main className="mx-auto max-w-7xl px-4 py-12">
                <p className="text-base text-muted-foreground">{t("loading")}</p>
            </main>
        );
    }

    const dashboardPath = homePathForRole(user.role);

    // Only the order's buyer or farmer may view it; otherwise show t("orderNotFound")
    if (!order || (order.buyerId !== user.id && order.farmerId !== user.id)) {
        return (
            <main className="mx-auto max-w-7xl px-4 py-8">
                <div className="flex flex-col gap-6">
                    <div>
                        <Button variant="ghost" asChild className="min-h-12 text-base font-medium gap-2 px-0 hover:bg-transparent">
                            <Link href={dashboardPath}>
                                <ArrowLeft className="size-5" />
                                <span>{t("dashboard")}</span>
                            </Link>
                        </Button>
                    </div>
                    <Card className="p-12 text-center">
                        <CardContent className="flex flex-col items-center gap-4 p-0">
                            <p className="text-xl font-medium text-muted-foreground">
                                {t("orderNotFound")}
                            </p>
                            <Button asChild size="lg" className="min-h-12 px-6 text-base font-semibold">
                                <Link href={dashboardPath}>
                                    {t("dashboard")}
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </main>
        );
    }

    const handleAccept = async () => {
        setIsProcessing(true);
        try {
            await updateOrderStatus(order.id, "accepted");
            toast.success(t("orderAccepted"));
            await loadOrderData();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            toast.error(message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async () => {
        setIsProcessing(true);
        try {
            await updateOrderStatus(order.id, "rejected");
            toast.success(t("orderRejected"));
            await loadOrderData();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            toast.error(message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUpdateStatus = async (nextStatus: OrderStatus) => {
        setIsProcessing(true);
        try {
            await updateOrderStatus(order.id, nextStatus);
            toast.success(t("statusUpdated"));
            await loadOrderData();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            toast.error(message);
        } finally {
            setIsProcessing(false);
        }
    };

    const isFarmer = user.role === "farmer";
    const isBuyer = user.role === "buyer";

    return (
        <main className="mx-auto max-w-7xl px-4 py-8 pb-16">
            <div className="flex flex-col gap-8">
                {/* Back link to viewer's own dashboard */}
                <div>
                    <Button variant="ghost" asChild className="min-h-12 text-base font-medium gap-2 px-0 hover:bg-transparent">
                        <Link href={dashboardPath}>
                            <ArrowLeft className="size-5" />
                            <span>{t("dashboard")}</span>
                        </Link>
                    </Button>
                </div>

                {/* Heading */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                        {t("orderDetails")}
                    </h1>
                </div>

                {/* Order Summary Card */}
                <Card className="p-6">
                    <CardHeader className="p-0 pb-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <CardTitle className="text-xl font-bold">
                                {t("orderSummary")}
                            </CardTitle>
                            <Badge
                                variant={order.status === "confirmed" ? "outline" : "secondary"}
                                className={cn("px-3 py-1 text-sm font-semibold", getStatusBadgeStyle(order.status))}
                            >
                                {t(statusKey[order.status])}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-0 pt-2 text-base">
                        <div>
                            <span className="text-muted-foreground block text-sm font-medium">{t("cropName")}</span>
                            <span className="text-lg font-bold text-foreground">
                                {listing?.crop || order.listingId}
                                {listing?.variety ? ` (${listing.variety})` : ""}
                            </span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block text-sm font-medium">{t("quantity")}</span>
                            <span className="text-lg font-bold text-foreground">{order.quantity}kg</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block text-sm font-medium">{t("agreedPrice")}</span>
                            <span className="text-lg font-bold text-foreground">₹{order.agreedPrice}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block text-sm font-medium">{t("totalPrice")}</span>
                            <span className="text-xl font-bold text-green-600 dark:text-green-500">
                                ₹{order.quantity * order.agreedPrice}
                            </span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block text-sm font-medium">{t("orderedOn")}</span>
                            <span className="text-base font-semibold text-foreground">
                                {order.createdAt.split("T")[0]}
                            </span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block text-sm font-medium">{t("orderStatus")}</span>
                            <span className="text-base font-semibold text-foreground">
                                {t(statusKey[order.status])}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Delivery Tracking Card placed below the order summary */}
                <Card className="p-6">
                    <CardHeader className="p-0 pb-6">
                        <CardTitle className="text-xl font-bold">
                            {t("trackingTitle")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-6 p-0">
                        {/* Status Stepper */}
                        <StatusStepper status={order.status} />

                        {/* Action area below the stepper */}
                        <div className="border-t border-border pt-4">
                            {/* Confirmed status for both farmer and buyer */}
                            {order.status === "confirmed" && (
                                <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800 dark:border-green-900/50 dark:bg-green-950/40 dark:text-green-300">
                                    <CheckCircle className="size-6 shrink-0 text-green-600 dark:text-green-400" />
                                    <span className="text-base font-semibold">{t("orderComplete")}</span>
                                </div>
                            )}

                            {/* Farmer action area */}
                            {isFarmer && order.status !== "confirmed" && (
                                <>
                                    {order.status === "requested" && (
                                        <div className="flex flex-col sm:flex-row items-center gap-4">
                                            <Button
                                                size="lg"
                                                disabled={isProcessing}
                                                onClick={handleAccept}
                                                className="min-h-12 w-full sm:w-auto px-8 text-base font-bold"
                                            >
                                                {isProcessing ? t("loading") : t("accept")}
                                            </Button>
                                            <Button
                                                size="lg"
                                                variant="outline"
                                                disabled={isProcessing}
                                                onClick={handleReject}
                                                className="min-h-12 w-full sm:w-auto px-8 text-base font-bold text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
                                            >
                                                {isProcessing ? t("loading") : t("reject")}
                                            </Button>
                                        </div>
                                    )}

                                    {order.status === "accepted" && (
                                        <Button
                                            size="lg"
                                            disabled={isProcessing}
                                            onClick={() => handleUpdateStatus("pickup_scheduled")}
                                            className="min-h-12 w-full sm:w-auto px-8 text-base font-bold"
                                        >
                                            {isProcessing ? t("loading") : t("schedulePickup")}
                                        </Button>
                                    )}

                                    {order.status === "pickup_scheduled" && (
                                        <Button
                                            size="lg"
                                            disabled={isProcessing}
                                            onClick={() => handleUpdateStatus("picked_up")}
                                            className="min-h-12 w-full sm:w-auto px-8 text-base font-bold"
                                        >
                                            {isProcessing ? t("loading") : t("markPickedUp")}
                                        </Button>
                                    )}

                                    {order.status === "picked_up" && (
                                        <Button
                                            size="lg"
                                            disabled={isProcessing}
                                            onClick={() => handleUpdateStatus("in_transit")}
                                            className="min-h-12 w-full sm:w-auto px-8 text-base font-bold"
                                        >
                                            {isProcessing ? t("loading") : t("markInTransit")}
                                        </Button>
                                    )}

                                    {order.status === "in_transit" && (
                                        <Button
                                            size="lg"
                                            disabled={isProcessing}
                                            onClick={() => handleUpdateStatus("delivered")}
                                            className="min-h-12 w-full sm:w-auto px-8 text-base font-bold"
                                        >
                                            {isProcessing ? t("loading") : t("markDelivered")}
                                        </Button>
                                    )}

                                    {order.status === "delivered" && (
                                        <div className="rounded-lg border border-border bg-muted/50 p-4 text-base font-medium text-muted-foreground">
                                            {t("waitingBuyer")}
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Buyer action area */}
                            {isBuyer && order.status !== "confirmed" && (
                                <>
                                    {order.status === "delivered" ? (
                                        <Button
                                            size="lg"
                                            disabled={isProcessing}
                                            onClick={() => handleUpdateStatus("confirmed")}
                                            className="min-h-12 w-full sm:w-auto px-8 text-base font-bold"
                                        >
                                            {isProcessing ? t("loading") : t("confirmReceipt")}
                                        </Button>
                                    ) : (
                                        order.status !== "rejected" && (
                                            <div className="rounded-lg border border-border bg-muted/50 p-4 text-base font-medium text-muted-foreground">
                                                {t("waitingFarmer")}
                                            </div>
                                        )
                                    )}
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Buyer and Farmer Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Buyer card */}
                    <Card className="p-6">
                        <CardHeader className="p-0 pb-4">
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <User className="size-5 text-primary" />
                                <span>{t("buyerInfo")}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3 p-0 text-base">
                            <div>
                                <span className="text-muted-foreground block text-sm font-medium">{t("name")}</span>
                                <span className="font-semibold text-foreground">{buyer?.name || "-"}</span>
                            </div>
                            {buyer?.businessName && (
                                <div>
                                    <span className="text-muted-foreground block text-sm font-medium">{t("businessName")}</span>
                                    <span className="font-semibold text-foreground">{buyer.businessName}</span>
                                </div>
                            )}
                            <div>
                                <span className="text-muted-foreground block text-sm font-medium">{t("phone")}</span>
                                <span className="font-semibold text-foreground">{buyer?.phone || "-"}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block text-sm font-medium">{t("location")}</span>
                                <span className="font-semibold text-foreground">{buyer?.location || "-"}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Farmer card */}
                    <Card className="p-6">
                        <CardHeader className="p-0 pb-4">
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <User className="size-5 text-primary" />
                                <span>{t("farmerInfo")}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3 p-0 text-base">
                            <div>
                                <span className="text-muted-foreground block text-sm font-medium">{t("name")}</span>
                                <span className="font-semibold text-foreground">{farmer?.name || "-"}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block text-sm font-medium">{t("phone")}</span>
                                <span className="font-semibold text-foreground">{farmer?.phone || "-"}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block text-sm font-medium">{t("location")}</span>
                                <span className="font-semibold text-foreground">{farmer?.location || "-"}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    );
}

export default function OrderDetailsPage({ params }: PageProps) {
    return (
        <Suspense fallback={<OrderDetailsFallback />}>
            <OrderDetailsContent params={params} />
        </Suspense>
    );
}
