import type { Profile, Listing, MarketPrice, Order } from "@/lib/types";

// SAMPLE DATA: illustrative only, not real farmers, buyers or prices.

export const mockProfiles: Profile[] = [
    { id: "f1", role: "farmer", name: "Ramesh Gowda", phone: "9000000001", location: "Kolar", preferredLanguage: "kn" },
    { id: "f2", role: "farmer", name: "Lakshmi Devi", phone: "9000000002", location: "Chikkaballapur", preferredLanguage: "kn" },
    { id: "f3", role: "farmer", name: "Suresh Kumar", phone: "9000000003", location: "Hosakote", preferredLanguage: "en" },
    { id: "b1", role: "buyer", name: "Anita Rao", phone: "9000000011", location: "Bengaluru", preferredLanguage: "en", businessName: "Green Basket Supermarket" },
    { id: "b2", role: "buyer", name: "Mohan Das", phone: "9000000012", location: "Bengaluru", preferredLanguage: "en", businessName: "Hotel Udupi Grand" },
];

export const mockListings: Listing[] = [
    { id: "l1", farmerId: "f1", crop: "Tomato", variety: "Hybrid", quantity: 500, unit: "kg", askingPrice: 20, grade: "A", harvestDate: "2026-11-17", location: "Kolar", photos: [], isAvailable: true },
    { id: "l2", farmerId: "f2", crop: "Tomato", variety: "Nati", quantity: 300, unit: "kg", askingPrice: 22, grade: "B", harvestDate: "2026-11-16", location: "Chikkaballapur", photos: [], isAvailable: true },
    { id: "l3", farmerId: "f3", crop: "Onion", variety: "Red", quantity: 800, unit: "kg", askingPrice: 28, grade: "A", harvestDate: "2026-11-15", location: "Hosakote", photos: [], isAvailable: true },
    { id: "l4", farmerId: "f1", crop: "Potato", quantity: 600, unit: "kg", askingPrice: 24, grade: "B", harvestDate: "2026-11-14", location: "Kolar", photos: [], isAvailable: true },
    { id: "l5", farmerId: "f2", crop: "Carrot", quantity: 250, unit: "kg", askingPrice: 35, grade: "A", harvestDate: "2026-11-18", location: "Chikkaballapur", photos: [], isAvailable: true },
    { id: "l6", farmerId: "f3", crop: "Beans", quantity: 150, unit: "kg", askingPrice: 45, grade: "A", harvestDate: "2026-11-18", location: "Hosakote", photos: [], isAvailable: true },
];

export const mockPrices: MarketPrice[] = [
    { crop: "Tomato", minPrice: 18, maxPrice: 24, market: "Bengaluru (sample)", reportedOn: "2026-11-18", source: "Illustrative sample data", isSample: true },
    { crop: "Onion", minPrice: 24, maxPrice: 32, market: "Bengaluru (sample)", reportedOn: "2026-11-18", source: "Illustrative sample data", isSample: true },
    { crop: "Potato", minPrice: 20, maxPrice: 28, market: "Bengaluru (sample)", reportedOn: "2026-11-18", source: "Illustrative sample data", isSample: true },
    { crop: "Carrot", minPrice: 30, maxPrice: 40, market: "Bengaluru (sample)", reportedOn: "2026-11-18", source: "Illustrative sample data", isSample: true },
    { crop: "Beans", minPrice: 40, maxPrice: 52, market: "Bengaluru (sample)", reportedOn: "2026-11-18", source: "Illustrative sample data", isSample: true },
];

export const mockOrders: Order[] = [];