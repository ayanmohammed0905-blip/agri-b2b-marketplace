// Orders service with Supabase RPC integration and mock data fallback.

import type { Order, OrderStatus } from "@/lib/types";
import { getState, saveState } from "@/lib/mock/store";
import { getSupabase } from "@/lib/supabase/client";
import { orderFromRow, type OrderRow } from "@/lib/supabase/mappers";

function isSupabaseMode(): boolean {
    return process.env.NEXT_PUBLIC_BACKEND === "supabase";
}

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

const ORDER_SELECT = `
    id,
    listing_id,
    buyer_id,
    farmer_id,
    quantity,
    agreed_price,
    status,
    created_at,
    updated_at,
    listings:listing_id (
        id,
        farmer_id,
        crop,
        variety,
        quantity,
        unit,
        asking_price,
        grade,
        harvest_date,
        location,
        photos,
        is_available
    ),
    buyer:profiles!buyer_id (
        id,
        role,
        name,
        phone,
        location,
        preferred_language,
        business_name
    ),
    farmer:profiles!farmer_id (
        id,
        role,
        name,
        phone,
        location,
        preferred_language,
        business_name
    )
`;

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
    if (!isSupabaseMode()) {
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

    const supabase = getSupabase();
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error("You must be signed in to place an order");
    }

    // Call place_order(p_listing_id uuid, p_quantity numeric)
    const { data, error } = await supabase.rpc("place_order", {
        p_listing_id: listingId,
        p_quantity: quantity,
    });

    if (error) {
        console.error("Error calling place_order RPC in Supabase:", error);
        throw new Error(error.message);
    }

    if (!data) {
        throw new Error("Failed to place order: no data returned from server");
    }

    const created = data as unknown as OrderRow;
    const populated = await getOrderById(created.id);
    return populated ?? orderFromRow(created);
}

export async function getOrderById(id: string): Promise<Order | null> {
    if (!isSupabaseMode()) {
        const { orders } = getState();
        const order = orders.find((item) => item.id === id);
        return order ?? null;
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
        .from("orders")
        .select(ORDER_SELECT)
        .eq("id", id)
        .maybeSingle();

    if (error) {
        console.error("Error fetching order by id from Supabase:", error);
        return null;
    }

    return data ? orderFromRow(data as unknown as OrderRow) : null;
}

export async function getOrdersForUser(userId: string): Promise<Order[]> {
    if (!isSupabaseMode()) {
        const { orders } = getState();
        return orders.filter(
            (item) => item.buyerId === userId || item.farmerId === userId
        );
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
        .from("orders")
        .select(ORDER_SELECT)
        .or(`buyer_id.eq.${userId},farmer_id.eq.${userId}`)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching orders for user from Supabase:", error);
        return [];
    }

    return (data as unknown as OrderRow[]).map(orderFromRow);
}

export async function getOrdersForBuyer(buyerId: string): Promise<Order[]> {
    if (!isSupabaseMode()) {
        const { orders } = getState();
        return orders.filter((item) => item.buyerId === buyerId);
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
        .from("orders")
        .select(ORDER_SELECT)
        .eq("buyer_id", buyerId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching buyer orders from Supabase:", error);
        return [];
    }

    return (data as unknown as OrderRow[]).map(orderFromRow);
}

export async function getOrdersForFarmer(farmerId: string): Promise<Order[]> {
    if (!isSupabaseMode()) {
        const { orders } = getState();
        return orders.filter((item) => item.farmerId === farmerId);
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
        .from("orders")
        .select(ORDER_SELECT)
        .eq("farmer_id", farmerId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching farmer orders from Supabase:", error);
        return [];
    }

    return (data as unknown as OrderRow[]).map(orderFromRow);
}

export async function updateOrderStatus(
    id: string,
    next: OrderStatus
): Promise<Order> {
    if (!isSupabaseMode()) {
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

    const supabase = getSupabase();
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error("You must be signed in to update order status");
    }

    // Call update_order_status(p_order_id uuid, p_next order_status)
    const { data, error } = await supabase.rpc("update_order_status", {
        p_order_id: id,
        p_next: next,
    });

    if (error) {
        console.error("Error calling update_order_status RPC in Supabase:", error);
        throw new Error(error.message);
    }

    const populated = await getOrderById(id);
    return populated ?? orderFromRow(data as unknown as OrderRow);
}
