import type { Profile, UserRole, Language, Listing, MarketPrice, Order, OrderStatus } from "@/lib/types";

export interface ProfileRow {
    id: string;
    role: UserRole;
    name: string;
    phone: string;
    location: string;
    preferred_language: Language;
    business_name?: string | null;
}

export function profileFromRow(row: ProfileRow): Profile {
    return {
        id: row.id,
        role: row.role,
        name: row.name,
        phone: row.phone,
        location: row.location,
        preferredLanguage: row.preferred_language,
        ...(row.business_name ? { businessName: row.business_name } : {}),
    };
}

export interface MarketPriceRow {
    id?: string;
    crop: string;
    min_price: number | string;
    max_price: number | string;
    market: string;
    reported_on: string;
    source: string;
    is_sample: boolean;
}

export function marketPriceFromRow(row: MarketPriceRow): MarketPrice {
    return {
        crop: row.crop,
        minPrice: Number(row.min_price),
        maxPrice: Number(row.max_price),
        market: row.market,
        reportedOn:
            typeof row.reported_on === "string"
                ? row.reported_on.split("T")[0]
                : String(row.reported_on),
        source: row.source,
        isSample: Boolean(row.is_sample),
    };
}

export interface ListingRow {
    id: string;
    farmer_id: string;
    crop: string;
    variety?: string | null;
    quantity: number | string;
    unit: "kg" | "quintal" | "ton";
    asking_price: number | string;
    grade: "A" | "B" | "C";
    harvest_date: string;
    location: string;
    photos?: string[] | null;
    is_available: boolean;
    created_at?: string;
    profiles?:
        | {
              name?: string;
              location?: string;
          }
        | {
              name?: string;
              location?: string;
          }[]
        | null;
}

export function listingFromRow(row: ListingRow): Listing {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
        id: row.id,
        farmerId: row.farmer_id,
        ...(profile?.name ? { farmerName: profile.name } : {}),
        crop: row.crop,
        ...(row.variety ? { variety: row.variety } : {}),
        quantity: Number(row.quantity),
        unit: row.unit,
        askingPrice: Number(row.asking_price),
        grade: row.grade,
        harvestDate:
            typeof row.harvest_date === "string"
                ? row.harvest_date.split("T")[0]
                : String(row.harvest_date),
        location: row.location || profile?.location || "",
        photos: Array.isArray(row.photos) ? row.photos : [],
        isAvailable: Boolean(row.is_available),
    };
}

export interface OrderRow {
    id: string;
    listing_id: string;
    buyer_id: string;
    farmer_id: string;
    quantity: number | string;
    agreed_price: number | string;
    status: OrderStatus;
    created_at: string;
    updated_at: string;
    listings?: ListingRow | ListingRow[] | null;
    listing?: ListingRow | ListingRow[] | null;
    buyer?: ProfileRow | ProfileRow[] | null;
    farmer?: ProfileRow | ProfileRow[] | null;
}

export function orderFromRow(row: OrderRow): Order {
    const listingRow = Array.isArray(row.listings)
        ? row.listings[0]
        : Array.isArray(row.listing)
          ? row.listing[0]
          : (row.listings || row.listing);

    const buyerRow = Array.isArray(row.buyer) ? row.buyer[0] : row.buyer;
    const farmerRow = Array.isArray(row.farmer) ? row.farmer[0] : row.farmer;

    const mappedListing = listingRow ? listingFromRow(listingRow) : undefined;
    const mappedBuyer = buyerRow ? profileFromRow(buyerRow) : undefined;
    const mappedFarmer = farmerRow ? profileFromRow(farmerRow) : undefined;

    return {
        id: row.id,
        listingId: row.listing_id,
        buyerId: row.buyer_id,
        farmerId: row.farmer_id,
        quantity: Number(row.quantity),
        agreedPrice: Number(row.agreed_price),
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        ...(mappedListing?.crop ? { crop: mappedListing.crop } : {}),
        ...(mappedBuyer?.name ? { buyerName: mappedBuyer.name } : {}),
        ...(mappedFarmer?.name ? { farmerName: mappedFarmer.name } : {}),
        ...(mappedListing ? { listing: mappedListing } : {}),
        ...(mappedBuyer ? { buyer: mappedBuyer } : {}),
        ...(mappedFarmer ? { farmer: mappedFarmer } : {}),
    };
}
