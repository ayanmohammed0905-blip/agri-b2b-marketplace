// Uses mock data and will later call Supabase.

import type { Listing } from "@/lib/types";
import { getState, saveState } from "@/lib/mock/store";

export interface ListingFilters {
    search?: string;
    maxPrice?: number;
    minQuantity?: number;
    location?: string;
}

export async function getListings(
    filters: ListingFilters = {}
): Promise<Listing[]> {
    const { listings } = getState();
    return listings.filter((listing) => {
        if (!listing.isAvailable || listing.quantity <= 0) {
            return false;
        }

        if (filters.search) {
            const query = filters.search.trim().toLowerCase();
            if (query && !listing.crop.toLowerCase().includes(query)) {
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

export async function getListingById(id: string): Promise<Listing | null> {
    const { listings } = getState();
    const listing = listings.find((item) => item.id === id);
    return listing ?? null;
}

export async function getListingsByFarmer(farmerId: string): Promise<Listing[]> {
    const { listings } = getState();
    return listings.filter((item) => item.farmerId === farmerId);
}

export async function createListing(
    data: Omit<Listing, "id" | "isAvailable">
): Promise<Listing> {
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
