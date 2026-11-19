"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { Dictionary } from "@/lib/i18n/en";
import type { Language } from "@/lib/types";

const profileSchema = z.object({
    name: z.string().trim().min(2, { message: "errName" }),
    location: z.string().trim().min(2, { message: "errLocation" }),
    businessName: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
    const { user, loading, updateProfile, logout } = useAuth();
    const { t, setLanguage } = useLanguage();
    const router = useRouter();

    const [selectedLang, setSelectedLang] = useState<Language>("en");

    useEffect(() => {
        if (!loading && !user) {
            router.replace("/login");
        }
        if (user?.preferredLanguage) {
            setSelectedLang(user.preferredLanguage);
        }
    }, [user, loading, router]);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: user?.name ?? "",
            location: user?.location ?? "",
            businessName: user?.businessName ?? "",
        },
    });

    useEffect(() => {
        if (user) {
            reset({
                name: user.name,
                location: user.location,
                businessName: user.businessName ?? "",
            });
            if (user.preferredLanguage) {
                setSelectedLang(user.preferredLanguage);
            }
        }
    }, [user, reset]);

    if (loading || !user) {
        return (
            <main className="mx-auto max-w-2xl px-4 py-12">
                <p className="text-base text-muted-foreground">{t("loading")}</p>
            </main>
        );
    }

    const onSubmit = async (data: ProfileFormData) => {
        try {
            await updateProfile({
                name: data.name,
                location: data.location,
                preferredLanguage: selectedLang,
                ...(user.role === "buyer" ? { businessName: data.businessName } : {}),
            });
            setLanguage(selectedLang);
            toast.success(t("profileSaved"));
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            toast.error(message);
        }
    };

    const handleLogout = async () => {
        await logout();
        router.push("/");
    };

    return (
        <main className="mx-auto max-w-2xl px-4 py-8 pb-16">
            <div className="flex flex-col gap-8">
                {/* Heading */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                        {t("profileTitle")}
                    </h1>
                </div>

                {/* Account Info Card */}
                <Card className="p-6">
                    <CardHeader className="p-0 pb-4">
                        <CardTitle className="text-xl font-bold">
                            {t("accountInfo")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4 p-0">
                        {/* Name (large) */}
                        <div>
                            <h2 className="text-2xl font-bold text-foreground">
                                {user.name}
                            </h2>
                        </div>

                        {/* Account Type */}
                        <div className="flex flex-col items-start gap-1">
                            <span className="text-sm font-medium text-muted-foreground">
                                {t("accountType")}
                            </span>
                            <Badge variant="secondary" className="px-3 py-1 text-sm font-semibold">
                                {user.role === "farmer" ? t("farmer") : t("buyer")}
                            </Badge>
                        </div>

                        {/* Phone Number (read-only with note) */}
                        <div className="flex flex-col gap-1 border-t border-border pt-3">
                            <span className="text-sm font-medium text-muted-foreground">
                                {t("phone")}
                            </span>
                            <span className="text-base font-semibold text-foreground">
                                {user.phone}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {t("phoneLocked")}
                            </span>
                        </div>

                        {/* Business name (for buyers) */}
                        {user.role === "buyer" && user.businessName && (
                            <div className="flex flex-col gap-1 border-t border-border pt-3">
                                <span className="text-sm font-medium text-muted-foreground">
                                    {t("businessName")}
                                </span>
                                <span className="text-base font-semibold text-foreground">
                                    {user.businessName}
                                </span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Edit Form Card */}
                <Card className="p-6">
                    <CardHeader className="p-0 pb-4">
                        <CardTitle className="text-xl font-bold">
                            {t("profile")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
                            {/* Name */}
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="name" className="text-base font-medium">
                                    {t("name")}
                                </Label>
                                <Input
                                    id="name"
                                    className="min-h-12 text-base"
                                    {...register("name")}
                                />
                                {errors.name?.message && (
                                    <p className="text-sm font-medium text-destructive">
                                        {t(errors.name.message as keyof Dictionary)}
                                    </p>
                                )}
                            </div>

                            {/* Location */}
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="location" className="text-base font-medium">
                                    {t("location")}
                                </Label>
                                <Input
                                    id="location"
                                    className="min-h-12 text-base"
                                    {...register("location")}
                                />
                                {errors.location?.message && (
                                    <p className="text-sm font-medium text-destructive">
                                        {t(errors.location.message as keyof Dictionary)}
                                    </p>
                                )}
                            </div>

                            {/* Business Name (buyers only, optional) */}
                            {user.role === "buyer" && (
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="businessName" className="text-base font-medium">
                                        {t("businessName")}
                                    </Label>
                                    <Input
                                        id="businessName"
                                        className="min-h-12 text-base"
                                        {...register("businessName")}
                                    />
                                </div>
                            )}

                            {/* Preferred Language as two large toggle buttons */}
                            <div className="flex flex-col gap-2">
                                <Label className="text-base font-medium">
                                    {t("preferredLanguage")}
                                </Label>
                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        type="button"
                                        variant={selectedLang === "en" ? "default" : "outline"}
                                        size="lg"
                                        onClick={() => setSelectedLang("en")}
                                        className="min-h-12 text-base font-semibold"
                                    >
                                        English
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={selectedLang === "kn" ? "default" : "outline"}
                                        size="lg"
                                        onClick={() => setSelectedLang("kn")}
                                        className="min-h-12 text-base font-semibold"
                                    >
                                        ಕನ್ನಡ
                                    </Button>
                                </div>
                            </div>

                            {/* Save changes button */}
                            <Button
                                type="submit"
                                size="lg"
                                disabled={isSubmitting}
                                className="min-h-12 w-full text-base font-bold mt-2"
                            >
                                {isSubmitting ? t("loading") : t("saveChanges")}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Logout Button */}
                <div className="pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={handleLogout}
                        className="min-h-12 w-full text-base font-semibold text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
                    >
                        {t("logout")}
                    </Button>
                </div>
            </div>
        </main>
    );
}
