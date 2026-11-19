"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { statusKey } from "@/lib/statusKeys";
import { cn } from "@/lib/utils";
import type { Order, OrderStatus } from "@/lib/types";

export interface OrderCardProps {
    order: Order;
    cropName: string;
    otherPartyName: string;
    href: string;
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

export function OrderCard({
    order,
    cropName,
    otherPartyName,
    href,
}: OrderCardProps) {
    const { t } = useLanguage();

    return (
        <Card className="p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-4 text-base">
                    <span className="text-lg font-bold text-foreground">
                        {cropName}
                    </span>
                    <span className="font-medium text-muted-foreground">
                        {order.quantity}kg
                    </span>
                    <span className="font-bold text-green-600 dark:text-green-500">
                        ₹{order.agreedPrice}
                    </span>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                        <User className="size-4 shrink-0 text-primary" />
                        <span className="truncate font-medium">{otherPartyName}</span>
                    </div>
                    <Badge
                        variant={order.status === "confirmed" ? "outline" : "secondary"}
                        className={cn("px-2.5 py-1 text-sm font-semibold", getStatusBadgeStyle(order.status))}
                    >
                        {t(statusKey[order.status])}
                    </Badge>
                </div>
                <div>
                    <Button asChild size="lg" className="min-h-12 w-full sm:w-auto px-6 text-base font-semibold">
                        <Link href={href}>
                            {t("viewOrder")}
                        </Link>
                    </Button>
                </div>
            </div>
        </Card>
    );
}
