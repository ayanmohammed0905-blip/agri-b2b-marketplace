// Listings service with Supabase integration and mock data fallback.

import type { Listing } from "@/lib/types";
import { getState, saveState } from "@/lib/mock/store";
import { getSupabase } from "@/lib/supabase/client";
import { listingFromRow, type ListingRow } from "@/lib/supabase/mappers";

function isSupabaseMode(): boolean {
    return process.env.NEXT_PUBLIC_BACKEND === "supabase";
}

export interface ListingFilters {
    search?: string;
    maxPrice?: number;
    minQuantity?: number;
    location?: string;
    farmerId?: string;
    isAvailable?: boolean;
    category?: string;
    crop?: string;
}

const DEFAULT_SELECT = `
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
    is_available,
    created_at,
    profiles (
        name,
        location
    )
`;

export async function getListings(
    filters: ListingFilters = {}
): Promise<Listing[]> {
    if (!isSupabaseMode()) {
        const { listings } = getState();
        return listings.filter((listing) => {
            if (filters.isAvailable !== undefined) {
                if (listing.isAvailable !== filters.isAvailable) {
                    return false;
                }
            } else if (!listing.isAvailable || listing.quantity <= 0) {
                return false;
            }

            if (filters.farmerId && listing.farmerId !== filters.farmerId) {
                return false;
            }

            if (filters.search) {
                const query = filters.search.trim().toLowerCase();
                if (
                    query &&
                    !listing.crop.toLowerCase().includes(query) &&
                    (!listing.variety || !listing.variety.toLowerCase().includes(query))
                ) {
                    return false;
                }
            }

            if (filters.crop) {
                const query = filters.crop.trim().toLowerCase();
                if (query && listing.crop.toLowerCase() !== query) {
                    return false;
                }
            }

            if (filters.maxPrice !== undefined) {
                if (listing.askingPrice > filters.maxPrice) {
                    return false;
                }
            }

            if (filters.minQuantity !== undefined) {
                if (listing.quantity < filters.minQuantity) {
                    return false;
                }
            }

            if (filters.location) {
                const loc = filters.location.trim().toLowerCase();
                if (loc && listing.location.trim().toLowerCase() !== loc) {
                    return false;
                }
            }

            return true;
        });
    }

    const supabase = getSupabase();
    let query = supabase
        .from("listings")
        .select(DEFAULT_SELECT)
        .order("created_at", { ascending: false });

    if (filters.isAvailable !== undefined) {
        query = query.eq("is_available", filters.isAvailable);
    } else {
        query = query.eq("is_available", true).gt("quantity", 0);
    }

    if (filters.farmerId) {
        query = query.eq("farmer_id", filters.farmerId);
    }

    if (filters.search) {
        const term = filters.search.trim();
        if (term) {
            query = query.or(`crop.ilike.%${term}%,variety.ilike.%${term}%`);
        }
    }

    if (filters.crop) {
        query = query.ilike("crop", filters.crop.trim());
    }

    if (filters.maxPrice !== undefined) {
        query = query.lte("asking_price", filters.maxPrice);
    }

    if (filters.minQuantity !== undefined) {
        query = query.gte("quantity", filters.minQuantity);
    }

    if (filters.location) {
        const loc = filters.location.trim();
        if (loc) {
            query = query.ilike("location", `%${loc}%`);
        }
    }

    const { data, error } = await query;
    if (error) {
        console.error("Error fetching listings from Supabase:", error);
        return [];
    }

    return (data as unknown as ListingRow[]).map(listingFromRow);
}

export async function getListingById(id: string): Promise<Listing | null> {
    if (!isSupabaseMode()) {
        const { listings } = getState();
        const listing = listings.find((item) => item.id === id);
        return listing ?? null;
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
        .from("listings")
        .select(DEFAULT_SELECT)
        .eq("id", id)
        .maybeSingle();

    if (error) {
        console.error("Error fetching listing by id from Supabase:", error);
        return null;
    }

    return data ? listingFromRow(data as unknown as ListingRow) : null;
}

export async function getListingsByFarmer(farmerId: string): Promise<Listing[]> {
    if (!isSupabaseMode()) {
        const { listings } = getState();
        return listings.filter((item) => item.farmerId === farmerId);
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
        .from("listings")
        .select(DEFAULT_SELECT)
        .eq("farmer_id", farmerId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching farmer listings from Supabase:", error);
        return [];
    }

    return (data as unknown as ListingRow[]).map(listingFromRow);
}

export async function createListing(
    data: Omit<Listing, "id" | "isAvailable">
): Promise<Listing> {
    if (!isSupabaseMode()) {
        const newListing: Listing = {
            ...data,
            id: `l${Date.now()}`,
            isAvailable: true,
        };

        const state = getState();
        state.listings.unshift(newListing);
        saveState();
        return newListing;
    }

    const supabase = getSupabase();
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error("You must be signed in to create a listing.");
    }

    const sanitizedPhotos = (data.photos || []).filter(
        (url) =>
            typeof url === "string" &&
            (url.startsWith("http://") ||
                url.startsWith("https://") ||
                url.startsWith("/"))
    );

    const insertPayload = {
        farmer_id: user.id,
        crop: data.crop.trim(),
        variety: data.variety?.trim() || null,
        quantity: Number(data.quantity),
        unit: data.unit,
        asking_price: Number(data.askingPrice),
        grade: data.grade,
        harvest_date: data.harvestDate,
        location: data.location.trim(),
        photos: sanitizedPhotos,
        is_available: true,
    };

    const { data: inserted, error } = await supabase
        .from("listings")
        .insert(insertPayload)
        .select(DEFAULT_SELECT)
        .single();

    if (error || !inserted) {
        console.error("Error creating listing in Supabase:", error);
        throw new Error(error?.message || "Failed to create listing");
    }

    return listingFromRow(inserted as unknown as ListingRow);
}

export async function updateListing(
    id: string,
    updates: Partial<Omit<Listing, "id" | "farmerId">>
): Promise<Listing> {
    if (!isSupabaseMode()) {
        const state = getState();
        const listingIndex = state.listings.findIndex((item) => item.id === id);
        if (listingIndex === -1) {
            throw new Error(`Listing not found: ${id}`);
        }
        const updated = {
            ...state.listings[listingIndex],
            ...updates,
        };
        state.listings[listingIndex] = updated;
        saveState();
        return updated;
    }

    const supabase = getSupabase();
    const payload: Record<string, unknown> = {};
    if (updates.crop !== undefined) payload.crop = updates.crop.trim();
    if (updates.variety !== undefined) payload.variety = updates.variety?.trim() || null;
    if (updates.quantity !== undefined) payload.quantity = Number(updates.quantity);
    if (updates.unit !== undefined) payload.unit = updates.unit;
    if (updates.askingPrice !== undefined) payload.asking_price = Number(updates.askingPrice);
    if (updates.grade !== undefined) payload.grade = updates.grade;
    if (updates.harvestDate !== undefined) payload.harvest_date = updates.harvestDate;
    if (updates.location !== undefined) payload.location = updates.location.trim();
    if (updates.isAvailable !== undefined) payload.is_available = updates.isAvailable;
    if (updates.photos !== undefined) {
        payload.photos = updates.photos.filter(
            (url) =>
                typeof url === "string" &&
                (url.startsWith("http://") ||
                    url.startsWith("https://") ||
                    url.startsWith("/"))
        );
    }

    const { data, error } = await supabase
        .from("listings")
        .update(payload)
        .eq("id", id)
        .select(DEFAULT_SELECT)
        .single();

    if (error || !data) {
        console.error("Error updating listing in Supabase:", error);
        throw new Error(error?.message || "Failed to update listing");
    }

    return listingFromRow(data as unknown as ListingRow);
}

export async function toggleListingStatus(
    id: string,
    isAvailable: boolean
): Promise<Listing> {
    return updateListing(id, { isAvailable });
}

export async function deleteListing(id: string): Promise<void> {
    if (!isSupabaseMode()) {
        const state = getState();
        state.listings = state.listings.filter((item) => item.id !== id);
        saveState();
        return;
    }

    const supabase = getSupabase();
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (error) {
        console.error("Error deleting listing in Supabase:", error);
        throw new Error(error.message || "Failed to delete listing");
    }
}
