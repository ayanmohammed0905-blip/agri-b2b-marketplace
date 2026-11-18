import type { OrderStatus } from "@/lib/types";
import type { Dictionary } from "@/lib/i18n/en";

export const statusKey: Record<OrderStatus, keyof Dictionary> = {
    requested: "statusRequested",
    accepted: "statusAccepted",
    rejected: "statusRejected",
    pickup_scheduled: "statusPickupScheduled",
    picked_up: "statusPickedUp",
    in_transit: "statusInTransit",
    delivered: "statusDelivered",
    confirmed: "statusConfirmed",
};
