import type { Listing, Order } from "@/lib/types";
import { mockListings, mockOrders } from "@/lib/mock/data";

interface State {
    listings: Listing[];
    orders: Order[];
}

const KEY = "agri-mock-state-v1";
let state: State | null = null;

function fresh(): State {
    return {
        listings: structuredClone(mockListings),
        orders: structuredClone(mockOrders),
    };
}

export function getState(): State {
    if (state) return state;
    try {
        const raw = localStorage.getItem(KEY);
        if (raw) {
            state = JSON.parse(raw) as State;
            return state;
        }
    } catch { }
    state = fresh();
    return state;
}

export function saveState() {
    try {
        localStorage.setItem(KEY, JSON.stringify(getState()));
    } catch { }
}

export function resetState() {
    state = fresh();
    saveState();
}