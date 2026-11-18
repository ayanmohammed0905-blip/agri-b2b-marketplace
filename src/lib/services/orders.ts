// Uses mock data and will later call Supabase.

import type { Order, OrderStatus } from "@/lib/types";
import { getState, saveState } from "@/lib/mock/store";

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    requested: ["accepted", "rejected"],
    accepted: ["pickup_scheduled"],
    pickup_scheduled: ["picked_up"],
    picked_up: ["in_transit"],
    in_transit: ["delivered"],
    delivered: ["confirmed"],
    rejected: [],
    confirmed: [],
};

export interface PlaceOrderInput {
    listingId: string;
    buyerId: string;
    quantity: number;
}

export async function placeOrder({
    listingId,
    buyerId,
    quantity,
}: PlaceOrderInput): Promise<Order> {
    const state = getState();
    const listing = state.listings.find((l) => l.id === listingId);

    if (!listing) {
        throw new Error(`Listing not found: ${listingId}`);
    }

    if (quantity <= 0) {
        throw new Error("Quantity must be greater than 0");
    }

    if (quantity > listing.quantity) {
        throw new Error("Quantity exceeds available listing quantity");
    }

    const now = new Date().toISOString();
    const newOrder: Order = {
        id: `o${Date.now()}`,
        listingId,
        buyerId,
        farmerId: listing.farmerId,
        quantity,
        agreedPrice: listing.askingPrice,
        status: "requested",
        createdAt: now,
        updatedAt: now,
    };

    state.orders.unshift(newOrder);
    saveState();
    return newOrder;
}

export async function getOrderById(id: string): Promise<Order | null> {
    const { orders } = getState();
    const order = orders.find((item) => item.id === id);
    return order ?? null;
}

export async function getOrdersForUser(userId: string): Promise<Order[]> {
    const { orders } = getState();
    return orders.filter(
        (item) => item.buyerId === userId || item.farmerId === userId
    );
}

export async function updateOrderStatus(
    id: string,
    next: OrderStatus
): Promise<Order> {
    const state = getState();
    const order = state.orders.find((item) => item.id === id);

    if (!order) {
        throw new Error(`Order not found: ${id}`);
    }

    const allowedNext = ALLOWED_TRANSITIONS[order.status];
    if (!allowedNext.includes(next)) {
        throw new Error(
            `Transition from "${order.status}" to "${next}" is not allowed`
        );
    }

    if (next === "accepted") {
        const listing = state.listings.find((l) => l.id === order.listingId);
        if (!listing) {
            throw new Error(`Listing not found: ${order.listingId}`);
        }
        if (listing.quantity < order.quantity) {
            throw new Error("Insufficient stock to accept order");
        }
        listing.quantity -= order.quantity;
        if (listing.quantity === 0) {
            listing.isAvailable = false;
        }
    }

    order.status = next;
    order.updatedAt = new Date().toISOString();
    saveState();
    return order;
}
