"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

const loginSchema = z.object({
    phone: z.string().regex(/^[6-9]\d{9}$/, { message: "errPhone" }),
    password: z.string().min(6, { message: "errPassword" }),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const { t } = useLanguage();
    const { login: authLogin } = useAuth();
    const router = useRouter();

    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            phone: "",
            password: "",
        },
    });

    const isMock = (process.env.NEXT_PUBLIC_BACKEND || "mock") === "mock";

    const handleLogin = async (phone: string, password?: string) => {
        try {
            setServerError(null);
            const user = await authLogin(phone, password);
            router.push(homePathForRole(user.role));
        } catch (err) {
            if (err instanceof Error && (err.message === "errLogin" || err.message === "errNotFound")) {
                setServerError(err.message);
            } else {
                setServerError("errLogin");
            }
        }
    };

    const onSubmit = async (data: LoginFormData) => {
        await handleLogin(data.phone, data.password);
    };

    return (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
            <Card className="w-full max-w-md p-6">
                <CardHeader className="mb-6 p-0 text-center">
                    <CardTitle className="text-2xl font-bold">
                        {t("loginTitle")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                        {serverError && (
                            <div className="rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">
                                {t(serverError as keyof Dictionary)}
                            </div>
                        )}

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

                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="password" className="text-base">{t("password")}</Label>
                            <Input
                                id="password"
                                type="password"
                                className="min-h-12 text-base"
                                {...register("password")}
                            />
                            {errors.password?.message && (
                                <p className="text-sm font-medium text-destructive">
                                    {t(errors.password.message as keyof Dictionary)}
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="mt-2 min-h-12 w-full text-base font-semibold"
                        >
                            {t("login")}
                        </Button>
                    </form>

                    {/* Demo Login Section */}
                    {isMock && (
                        <div className="mt-6 border-t border-border pt-6">
                            <p className="mb-3 text-center text-sm text-muted-foreground">
                                {t("demoNote")}
                            </p>
                            <div className="flex flex-col gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="min-h-12 w-full text-base font-medium"
                                    onClick={() => handleLogin("9000000001", "demo123")}
                                >
                                    {t("demoFarmer")}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="min-h-12 w-full text-base font-medium"
                                    onClick={() => handleLogin("9000000011", "demo123")}
                                >
                                    {t("demoBuyer")}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* No account */}
                    <div className="mt-6 text-center text-sm text-muted-foreground">
                        <span>{t("noAccount")} </span>
                        <Link
                            href="/register"
                            className="font-semibold text-primary underline underline-offset-4 hover:text-primary/80"
                        >
                            {t("register")}
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
