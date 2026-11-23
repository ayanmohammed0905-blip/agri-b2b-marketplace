// Market prices service with Supabase integration and mock data fallback.

import type { MarketPrice } from "@/lib/types";
import { mockPrices } from "@/lib/mock/data";
import { getSupabase } from "@/lib/supabase/client";
import { marketPriceFromRow, type MarketPriceRow } from "@/lib/supabase/mappers";

function isSupabaseMode(): boolean {
    return process.env.NEXT_PUBLIC_BACKEND === "supabase";
}

export async function getReferencePrice(crop: string): Promise<MarketPrice | null> {
    if (!isSupabaseMode()) {
        const normalized = crop.trim().toLowerCase();
        const match = mockPrices.find(
            (p) => p.crop.toLowerCase() === normalized
        );
        return match ?? null;
    }

    const supabase = getSupabase();
    const normalized = crop.trim();
    if (!normalized) return null;

    const { data, error } = await supabase
        .from("market_prices")
        .select("id, crop, min_price, max_price, market, reported_on, source, is_sample")
        .ilike("crop", normalized)
        .order("reported_on", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error("Error fetching reference price from Supabase:", error);
        return null;
    }

    return data ? marketPriceFromRow(data as MarketPriceRow) : null;
}

export async function getMarketPrices(): Promise<MarketPrice[]> {
    if (!isSupabaseMode()) {
        return [...mockPrices];
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
        .from("market_prices")
        .select("id, crop, min_price, max_price, market, reported_on, source, is_sample")
        .order("crop", { ascending: true })
        .order("reported_on", { ascending: false });

    if (error || !data) {
        console.error("Error fetching market prices from Supabase:", error);
        return [];
    }

    return (data as MarketPriceRow[]).map(marketPriceFromRow);
}
