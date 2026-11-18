"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
    Tractor,
    Store,
    Users,
    TrendingDown,
    Scissors,
    Truck,
    Globe,
    PlusCircle,
    ShoppingBag,
    CheckCircle2,
    PackageCheck,
    Mic,
    Languages,
    TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { Dictionary } from "@/lib/i18n/en";

interface ProblemItem {
    key: keyof Dictionary;
    icon: LucideIcon;
}

interface StepItem {
    key: keyof Dictionary;
    icon: LucideIcon;
}

interface BenefitItem {
    key: keyof Dictionary;
    icon: LucideIcon;
}

const problems: ProblemItem[] = [
    { key: "problem1", icon: Users },
    { key: "problem2", icon: TrendingDown },
    { key: "problem3", icon: Scissors },
    { key: "problem4", icon: Truck },
    { key: "problem5", icon: Globe },
];

const steps: StepItem[] = [
    { key: "step1", icon: PlusCircle },
    { key: "step2", icon: ShoppingBag },
    { key: "step3", icon: CheckCircle2 },
    { key: "step4", icon: PackageCheck },
];

const benefits: BenefitItem[] = [
    { key: "benefit1", icon: Mic },
    { key: "benefit2", icon: Languages },
    { key: "benefit3", icon: TrendingUp },
];

export default function LandingPage() {
    const { t } = useLanguage();

    return (
        <main className="flex flex-col">
            {/* 1. Hero */}
            <section className="bg-brand-dark py-16 text-white md:py-24">
                <div className="mx-auto flex max-w-7xl flex-col items-center px-4 text-center">
                    <h1 className="max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
                        {t("heroTitle")}
                    </h1>
                    <p className="mt-6 max-w-2xl text-lg text-white/80">
                        {t("heroSubtitle")}
                    </p>
                    <div className="mt-8 flex w-full flex-col justify-center gap-4 sm:w-auto sm:flex-row">
                        <Button
                            size="lg"
                            asChild
                            className="min-h-14 gap-3 px-8 text-lg"
                        >
                            <Link href="/register?role=farmer">
                                <Tractor className="size-6" />
                                {t("imFarmer")}
                            </Link>
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            asChild
                            className="min-h-14 gap-3 px-8 text-lg"
                        >
                            <Link href="/register?role=buyer">
                                <Store className="size-6" />
                                {t("imBuyer")}
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* 2. Problems */}
            <section className="bg-background py-16 md:py-20">
                <div className="mx-auto max-w-7xl px-4">
                    <h2 className="mb-10 text-center text-3xl font-bold tracking-tight md:text-4xl">
                        {t("problemsTitle")}
                    </h2>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {problems.map((problem) => {
                            const Icon = problem.icon;
                            return (
                                <Card key={problem.key} className="h-full">
                                    <CardHeader className="flex flex-row items-center gap-4 p-6">
                                        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                            <Icon className="size-6" />
                                        </div>
                                        <CardTitle className="text-base font-medium leading-snug md:text-lg">
                                            {t(problem.key)}
                                        </CardTitle>
                                    </CardHeader>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* 3. How it works */}
            <section className="bg-muted py-16 md:py-20">
                <div className="mx-auto max-w-7xl px-4">
                    <h2 className="mb-12 text-center text-3xl font-bold tracking-tight md:text-4xl">
                        {t("howTitle")}
                    </h2>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                        {steps.map((step, index) => {
                            const Icon = step.icon;
                            return (
                                <Card
                                    key={step.key}
                                    className="flex flex-col items-center p-6 text-center"
                                >
                                    <div className="relative mb-4">
                                        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                            <Icon className="size-8" />
                                        </div>
                                        <span className="absolute -right-2 -top-2 flex size-7 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground shadow-xs">
                                            {index + 1}
                                        </span>
                                    </div>
                                    <CardTitle className="text-base font-semibold leading-snug md:text-lg">
                                        {t(step.key)}
                                    </CardTitle>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* 4. Benefits */}
            <section className="bg-background py-16 md:py-20">
                <div className="mx-auto max-w-7xl px-4">
                    <h2 className="mb-12 text-center text-3xl font-bold tracking-tight md:text-4xl">
                        {t("benefitsTitle")}
                    </h2>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        {benefits.map((benefit) => {
                            const Icon = benefit.icon;
                            return (
                                <Card
                                    key={benefit.key}
                                    className="flex flex-col items-center p-8 text-center"
                                >
                                    <div className="mb-5 flex size-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                        <Icon className="size-7" />
                                    </div>
                                    <CardTitle className="text-lg font-semibold leading-snug md:text-xl">
                                        {t(benefit.key)}
                                    </CardTitle>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* 5. Footer */}
            <footer className="border-t border-border bg-muted/40 py-8">
                <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-1.5 px-4 text-center text-sm text-muted-foreground">
                    <p className="font-medium text-foreground/80">{t("appName")}</p>
                    <p>{t("footerNote")}</p>
                </div>
            </footer>
        </main>
    );
}
