"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Camera, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { PriceReference } from "@/components/listings/PriceReference";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useAuth } from "@/lib/auth/AuthProvider";
import { createListing } from "@/lib/services/listings";
import type { Dictionary } from "@/lib/i18n/en";

const listingSchema = z.object({
    crop: z.string().trim().min(1, { message: "errCrop" }),
    variety: z.string().optional(),
    quantity: z.number({ message: "errQuantity" }).gt(0, { message: "errQuantity" }),
    unit: z.enum(["kg", "quintal", "ton"]),
    askingPrice: z.number({ message: "errPrice" }).gt(0, { message: "errPrice" }),
    grade: z.enum(["A", "B", "C"]),
    harvestDate: z.string().min(1, { message: "errDate" }),
    location: z.string().min(1),
});

export type ListingFormData = z.infer<typeof listingSchema>;

export interface ListingFormProps {
    defaultValues?: Partial<ListingFormData & { photos: string[] }>;
}

export function ListingForm({ defaultValues }: ListingFormProps) {
    const { t } = useLanguage();
    const { user } = useAuth();
    const router = useRouter();

    const [photoUrls, setPhotoUrls] = useState<string[]>(
        defaultValues?.photos ?? []
    );

    const today = new Date().toISOString().split("T")[0];

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<ListingFormData>({
        resolver: zodResolver(listingSchema),
        defaultValues: {
            crop: defaultValues?.crop ?? "",
            variety: defaultValues?.variety ?? "",
            quantity: defaultValues?.quantity,
            unit: defaultValues?.unit ?? "kg",
            askingPrice: defaultValues?.askingPrice,
            grade: defaultValues?.grade ?? "A",
            harvestDate: defaultValues?.harvestDate ?? today,
            location: defaultValues?.location ?? user?.location ?? "",
        },
    });

    useEffect(() => {
        if (defaultValues) {
            reset({
                crop: defaultValues.crop ?? "",
                variety: defaultValues.variety ?? "",
                quantity: defaultValues.quantity,
                unit: defaultValues.unit ?? "kg",
                askingPrice: defaultValues.askingPrice,
                grade: defaultValues.grade ?? "A",
                harvestDate: defaultValues.harvestDate ?? today,
                location: defaultValues.location ?? user?.location ?? "",
            });
            if (defaultValues.photos) {
                setPhotoUrls(defaultValues.photos);
            }
        }
    }, [defaultValues, reset, today, user]);

    useEffect(() => {
        return () => {
            photoUrls.forEach((url) => {
                if (url.startsWith("blob:")) {
                    URL.revokeObjectURL(url);
                }
            });
        };
    }, [photoUrls]);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const remainingSlots = 4 - photoUrls.length;
        if (remainingSlots <= 0) return;

        const selectedFiles = Array.from(files).slice(0, remainingSlots);
        const newUrls = selectedFiles.map((file) => URL.createObjectURL(file));

        setPhotoUrls((prev) => [...prev, ...newUrls]);
        e.target.value = "";
    };

    const removePhoto = (index: number) => {
        setPhotoUrls((prev) => {
            const urlToRemove = prev[index];
            if (urlToRemove && urlToRemove.startsWith("blob:")) {
                URL.revokeObjectURL(urlToRemove);
            }
            return prev.filter((_, i) => i !== index);
        });
    };

    const currentGrade = watch("grade");
    const currentUnit = watch("unit");
    const watchedCrop = watch("crop");
    const watchedPrice = watch("askingPrice");

    const onSubmit = async (data: ListingFormData) => {
        if (!user) return;

        // Browser-only preview URLs; real uploads will use Supabase Storage later.
        await createListing({
            farmerId: user.id,
            crop: data.crop.trim(),
            variety: data.variety?.trim() || undefined,
            quantity: Number(data.quantity),
            unit: data.unit,
            askingPrice: Number(data.askingPrice),
            grade: data.grade,
            harvestDate: data.harvestDate,
            location: data.location.trim(),
            photos: photoUrls,
        });

        toast.success(t("listingPublished"));
        router.push("/farmer/dashboard");
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
            {/* Crop name */}
            <div className="flex flex-col gap-1.5">
                <Label htmlFor="crop" className="text-base font-medium">
                    {t("cropName")}
                </Label>
                <Input
                    id="crop"
                    className="min-h-12 text-base"
                    {...register("crop")}
                />
                {errors.crop?.message && (
                    <p className="text-sm font-medium text-destructive">
                        {t(errors.crop.message as keyof Dictionary)}
                    </p>
                )}
            </div>

            {/* Variety */}
            <div className="flex flex-col gap-1.5">
                <Label htmlFor="variety" className="text-base font-medium">
                    {t("variety")}
                </Label>
                <Input
                    id="variety"
                    className="min-h-12 text-base"
                    {...register("variety")}
                />
            </div>

            {/* Quantity and Unit */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="quantity" className="text-base font-medium">
                        {t("quantity")}
                    </Label>
                    <Input
                        id="quantity"
                        type="number"
                        step="any"
                        className="min-h-12 text-base"
                        {...register("quantity", { valueAsNumber: true })}
                    />
                    {errors.quantity?.message && (
                        <p className="text-sm font-medium text-destructive">
                            {t(errors.quantity.message as keyof Dictionary)}
                        </p>
                    )}
                </div>

                <div className="flex flex-col gap-1.5">
                    <Label className="text-base font-medium">{t("unit")}</Label>
                    <Select
                        value={currentUnit}
                        onValueChange={(val: "kg" | "quintal" | "ton") =>
                            setValue("unit", val, { shouldValidate: true })
                        }
                    >
                        <SelectTrigger className="min-h-12 w-full text-base">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="kg">kg</SelectItem>
                            <SelectItem value="quintal">quintal</SelectItem>
                            <SelectItem value="ton">ton</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Asking price */}
            <div className="flex flex-col gap-1.5">
                <Label htmlFor="askingPrice" className="text-base font-medium">
                    {t("askingPrice")}
                </Label>
                <Input
                    id="askingPrice"
                    type="number"
                    step="any"
                    className="min-h-12 text-base"
                    {...register("askingPrice", { valueAsNumber: true })}
                />
                {errors.askingPrice?.message && (
                    <p className="text-sm font-medium text-destructive">
                        {t(errors.askingPrice.message as keyof Dictionary)}
                    </p>
                )}
                <PriceReference
                    crop={watchedCrop || ""}
                    askingPrice={Number(watchedPrice) || 0}
                />
            </div>

            {/* Quality Grade */}
            <div className="flex flex-col gap-2">
                <Label className="text-base font-medium">{t("grade")}</Label>
                <div className="grid grid-cols-3 gap-3">
                    {(["A", "B", "C"] as const).map((gradeOption) => (
                        <Button
                            key={gradeOption}
                            type="button"
                            variant={currentGrade === gradeOption ? "default" : "outline"}
                            className="min-h-12 text-base font-semibold"
                            onClick={() => setValue("grade", gradeOption, { shouldValidate: true })}
                        >
                            {gradeOption}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Harvest Date */}
            <div className="flex flex-col gap-1.5">
                <Label htmlFor="harvestDate" className="text-base font-medium">
                    {t("harvestDate")}
                </Label>
                <Input
                    id="harvestDate"
                    type="date"
                    className="min-h-12 text-base"
                    {...register("harvestDate")}
                />
                {errors.harvestDate?.message && (
                    <p className="text-sm font-medium text-destructive">
                        {t(errors.harvestDate.message as keyof Dictionary)}
                    </p>
                )}
            </div>

            {/* Location */}
            <div className="flex flex-col gap-1.5">
                <Label htmlFor="location" className="text-base font-medium">
                    {t("location")}
                </Label>
                <Input
                    id="location"
                    className="min-h-12 text-base"
                    {...register("location")}
                />
            </div>

            {/* Photos */}
            <div className="flex flex-col gap-2">
                <Label className="text-base font-medium">{t("photos")}</Label>
                {photoUrls.length < 4 && (
                    <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-input bg-muted/30 px-4 py-3 text-base font-medium text-muted-foreground transition-colors hover:bg-muted/50">
                        <Camera className="size-5" />
                        <span>{t("addPhotos")}</span>
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={handlePhotoChange}
                        />
                    </label>
                )}
                {photoUrls.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {photoUrls.map((url, index) => (
                            <div
                                key={url}
                                className="relative aspect-square overflow-hidden rounded-lg border border-border"
                            >
                                <img
                                    src={url}
                                    alt=""
                                    className="h-full w-full object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => removePhoto(index)}
                                    className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-black"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Actions: Cancel & Submit */}
            <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                    type="button"
                    variant="outline"
                    className="min-h-12 text-base font-medium"
                    onClick={() => router.push("/farmer/dashboard")}
                >
                    {t("cancel")}
                </Button>
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="min-h-12 text-base font-semibold"
                >
                    {t("publishListing")}
                </Button>
            </div>
        </form>
    );
}
