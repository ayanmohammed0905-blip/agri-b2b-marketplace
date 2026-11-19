export interface ParsedListing {
    crop?: string;
    quantity?: number;
    unit?: "kg" | "quintal" | "ton";
    askingPrice?: number;
}

interface CropEntry {
    name: string;
    aliases: string[];
}

const CROPS: CropEntry[] = [
    {
        name: "Tomato",
        aliases: ["tomato", "tomatoes", "ಟೊಮೆಟೊ", "ಟೊಮ್ಯಾಟೊ", "ಟೊಮೇಟೊ"],
    },
    {
        name: "Onion",
        aliases: ["onion", "onions", "ಈರುಳ್ಳಿ"],
    },
    {
        name: "Potato",
        aliases: ["potato", "potatoes", "ಆಲೂಗಡ್ಡೆ", "ಆಲೂಗೆಡ್ಡೆ"],
    },
    {
        name: "Carrot",
        aliases: ["carrot", "carrots", "ಗಜ್ಜರಿ", "ಕ್ಯಾರೆಟ್"],
    },
    {
        name: "Beans",
        aliases: ["beans", "bean", "ಬೀನ್ಸ್", "ಹುರುಳಿಕಾಯಿ"],
    },
];

interface UnitMapping {
    unit: "kg" | "quintal" | "ton";
    alias: string;
}

const UNIT_MAPPINGS: UnitMapping[] = ([
    { unit: "kg", alias: "kilograms" },
    { unit: "kg", alias: "kilogram" },
    { unit: "kg", alias: "kilos" },
    { unit: "kg", alias: "kilo" },
    { unit: "kg", alias: "kgs" },
    { unit: "kg", alias: "kg" },
    { unit: "kg", alias: "ಕಿಲೋಗ್ರಾಂ" },
    { unit: "kg", alias: "ಕಿಲೋ" },
    { unit: "kg", alias: "ಕೇಜಿ" },
    { unit: "kg", alias: "ಕೆಜಿ" },

    { unit: "quintal", alias: "quintals" },
    { unit: "quintal", alias: "quintal" },
    { unit: "quintal", alias: "ಕ್ವಿಂಟಾಲ್" },
    { unit: "quintal", alias: "ಕ್ವಿಂಟಲ್" },

    { unit: "ton", alias: "tonnes" },
    { unit: "ton", alias: "tonne" },
    { unit: "ton", alias: "tons" },
    { unit: "ton", alias: "ton" },
    { unit: "ton", alias: "ಟನ್" },
] as UnitMapping[]).sort((a, b) => b.alias.length - a.alias.length);

const RUPEE_FOLLOWED: string[] = [
    "rupees",
    "rupee",
    "ರೂಪಾಯಿ",
    "rs.",
    "rs",
    "ರೂ",
    "₹",
].sort((a, b) => b.length - a.length);

function normaliseText(text: string): string {
    let lower = text.toLowerCase();

    // Convert Kannada digits (೦-೯) to 0-9
    const kannadaDigits = "೦೧೨೩೪೫೬೭೮೯";
    lower = lower.replace(/[೦-೯]/g, (ch) => {
        const idx = kannadaDigits.indexOf(ch);
        return idx !== -1 ? String(idx) : ch;
    });

    // Strip commas inside numbers: e.g. 1,000 -> 1000
    while (/(\d+),(\d+)/.test(lower)) {
        lower = lower.replace(/(\d+),(\d+)/g, "$1$2");
    }

    return lower;
}

function matchUnit(afterStr: string): "kg" | "quintal" | "ton" | null {
    const trimmed = afterStr.replace(/^\s*/, "");
    for (const mapping of UNIT_MAPPINGS) {
        if (trimmed.startsWith(mapping.alias)) {
            const nextChar = trimmed.slice(mapping.alias.length, mapping.alias.length + 1);
            if (!nextChar || !/[a-z0-9\u0C80-\u0CFF]/.test(nextChar)) {
                return mapping.unit;
            }
        }
    }
    return null;
}

function matchRupeeFollowed(afterStr: string): boolean {
    const trimmed = afterStr.replace(/^\s*/, "");
    for (const word of RUPEE_FOLLOWED) {
        if (trimmed.startsWith(word)) {
            const nextChar = trimmed.slice(word.length, word.length + 1);
            if (!nextChar || !/[a-z0-9\u0C80-\u0CFF]/.test(nextChar)) {
                return true;
            }
        }
    }
    return false;
}

function matchRupeePreceded(beforeStr: string): boolean {
    return /(?:^|[^a-z0-9\u0C80-\u0CFF])(₹|rs\.|rs)\s*$/i.test(beforeStr);
}

export function parseListing(transcript: string): ParsedListing {
    const text = normaliseText(transcript);
    const result: ParsedListing = {};

    // 1. Crop dictionary mapping (first match in text wins)
    let earliestCropIndex = -1;
    let detectedCrop: string | undefined;

    for (const crop of CROPS) {
        for (const alias of crop.aliases) {
            const idx = text.indexOf(alias);
            if (idx !== -1) {
                if (earliestCropIndex === -1 || idx < earliestCropIndex) {
                    earliestCropIndex = idx;
                    detectedCrop = crop.name;
                }
            }
        }
    }

    if (detectedCrop) {
        result.crop = detectedCrop;
    }

    // 2. Extract number tokens
    const numberRegex = /\d+(?:\.\d+)?/g;
    interface Token {
        value: number;
        startIndex: number;
        endIndex: number;
    }

    const tokens: Token[] = [];
    let match: RegExpExecArray | null;
    while ((match = numberRegex.exec(text)) !== null) {
        tokens.push({
            value: Number(match[0]),
            startIndex: match.index,
            endIndex: match.index + match[0].length,
        });
    }

    // 3. Find quantity: number immediately followed (optional space) by a unit word
    let quantityTokenIndex = -1;
    for (const token of tokens) {
        const afterStr = text.slice(token.endIndex);
        const unit = matchUnit(afterStr);
        if (unit) {
            result.quantity = token.value;
            result.unit = unit;
            quantityTokenIndex = token.startIndex;
            break;
        }
    }

    // 4. Find price: number followed by rupee word OR preceded by ₹ / rs / rs.
    // If the quantity number and price number would be the same token, use it only for quantity.
    for (const token of tokens) {
        if (token.startIndex === quantityTokenIndex) {
            continue;
        }

        const afterStr = text.slice(token.endIndex);
        const beforeStr = text.slice(0, token.startIndex);

        if (matchRupeeFollowed(afterStr) || matchRupeePreceded(beforeStr)) {
            result.askingPrice = token.value;
            break;
        }
    }

    return result;
}
