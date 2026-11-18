"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useAuth, homePathForRole } from "@/lib/auth/AuthProvider";
import type { Dictionary } from "@/lib/i18n/en";
import type { UserRole } from "@/lib/types";

const registerSchema = z.object({
    role: z.enum(["farmer", "buyer"]),
    name: z.string().min(2, { message: "errName" }),
    phone: z.string().regex(/^[6-9]\d{9}$/, { message: "errPhone" }),
    location: z.string().min(2, { message: "errLocation" }),
    businessName: z.string().optional(),
});

type RegisterFormData = z.infer<typeof registerSchema>;

function RegisterForm() {
    const searchParams = useSearchParams();
    const roleParam = searchParams.get("role");
    const initialRole: UserRole = roleParam === "buyer" ? "buyer" : "farmer";

    const { language, t } = useLanguage();
    const { register: authRegister } = useAuth();
    const router = useRouter();

    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            role: initialRole,
            name: "",
            phone: "",
            location: "",
            businessName: "",
        },
    });

    const currentRole = watch("role");

    const onSubmit = async (data: RegisterFormData) => {
        try {
            setServerError(null);
            const user = await authRegister({
                name: data.name,
                phone: data.phone,
                location: data.location,
                role: data.role,
                preferredLanguage: language,
                businessName: data.role === "buyer" && data.businessName ? data.businessName : undefined,
            });
            router.push(homePathForRole(user.role));
        } catch (err) {
            if (err instanceof Error && err.message === "errExists") {
                setServerError("errExists");
            } else {
                setServerError("errExists");
            }
        }
    };

    return (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
            <Card className="w-full max-w-md p-6">
                <CardHeader className="mb-6 p-0 text-center">
                    <CardTitle className="text-2xl font-bold">
                        {t("createAccount")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                        {serverError && (
                            <div className="rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">
                                {t(serverError as keyof Dictionary)}
                            </div>
                        )}

                        {/* Role Selection */}
                        <div className="flex flex-col gap-2">
                            <Label className="text-base">{t("iAmA")}</Label>
                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    type="button"
                                    variant={currentRole === "farmer" ? "default" : "outline"}
                                    className="min-h-12 text-base font-medium"
                                    onClick={() => setValue("role", "farmer", { shouldValidate: true })}
                                >
                                    {t("farmer")}
                                </Button>
                                <Button
                                    type="button"
                                    variant={currentRole === "buyer" ? "default" : "outline"}
                                    className="min-h-12 text-base font-medium"
                                    onClick={() => setValue("role", "buyer", { shouldValidate: true })}
                                >
                                    {t("buyer")}
                                </Button>
                            </div>
                        </div>

                        {/* Full Name */}
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="name" className="text-base">{t("name")}</Label>
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

                        {/* Phone Number */}
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="phone" className="text-base">{t("phone")}</Label>
                            <Input
                                id="phone"
                                type="tel"
                                className="min-h-12 text-base"
                                {...register("phone")}
                            />
                            {errors.phone?.message && (
                                <p className="text-sm font-medium text-destructive">
                                    {t(errors.phone.message as keyof Dictionary)}
                                </p>
                            )}
                        </div>

                        {/* Location */}
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="location" className="text-base">{t("location")}</Label>
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

                        {/* Business Name (Buyer only) */}
                        {currentRole === "buyer" && (
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="businessName" className="text-base">
                                    {t("businessName")}
                                </Label>
                                <Input
                                    id="businessName"
                                    className="min-h-12 text-base"
                                    {...register("businessName")}
                                />
                                {errors.businessName?.message && (
                                    <p className="text-sm font-medium text-destructive">
                                        {t(errors.businessName.message as keyof Dictionary)}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="mt-2 min-h-12 w-full text-base font-semibold"
                        >
                            {t("createAccount")}
                        </Button>
                    </form>

                    {/* Have an account */}
                    <div className="mt-6 text-center text-sm text-muted-foreground">
                        <span>{t("haveAccount")} </span>
                        <Link
                            href="/login"
                            className="font-semibold text-primary underline underline-offset-4 hover:text-primary/80"
                        >
                            {t("login")}
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={null}>
            <RegisterForm />
        </Suspense>
    );
}
