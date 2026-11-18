// Uses mock data and will later call Supabase.

import type { MarketPrice } from "@/lib/types";
import { mockPrices } from "@/lib/mock/data";

export async function getReferencePrice(crop: string): Promise<MarketPrice | null> {
    const normalized = crop.trim().toLowerCase();
    const match = mockPrices.find(
        (p) => p.crop.toLowerCase() === normalized
    );
    return match ?? null;
}
