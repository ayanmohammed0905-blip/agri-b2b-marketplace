export type UserRole = "farmer" | "buyer";
export type Language = "en" | "kn";

export interface Profile {
    id: string;
    role: UserRole;
    name: string;
    phone: string;
    location: string;
    preferredLanguage: Language;
    businessName?: string;
}

export interface Listing {
    id: string;
    farmerId: string;
    crop: string;
    variety?: string;
    quantity: number;
    unit: "kg" | "quintal" | "ton";
    askingPrice: number;
    grade: "A" | "B" | "C";
    harvestDate: string;
    location: string;
    photos: string[];
    isAvailable: boolean;
}

export interface MarketPrice {
    crop: string;
    minPrice: number;
    maxPrice: number;
    market: string;
    reportedOn: string;
    source: string;
    isSample: boolean;
}

export type OrderStatus =
    | "requested"
    | "accepted"
    | "rejected"
    | "pickup_scheduled"
    | "picked_up"
    | "in_transit"
    | "delivered"
    | "confirmed";

export interface Order {
    id: string;
    listingId: string;
    buyerId: string;
    farmerId: string;
    quantity: number;
    agreedPrice: number;
    status: OrderStatus;
    createdAt: string;
    updatedAt: string;
}