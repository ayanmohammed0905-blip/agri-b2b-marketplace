"use client";

import { Check, XCircle } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { statusKey } from "@/lib/statusKeys";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/types";

export interface StatusStepperProps {
    status: OrderStatus;
}

const STEPS: OrderStatus[] = [
    "requested",
    "accepted",
    "pickup_scheduled",
    "picked_up",
    "in_transit",
    "delivered",
    "confirmed",
];

export function StatusStepper({ status }: StatusStepperProps) {
    const { t } = useLanguage();

    if (status === "rejected") {
        return (
            <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                <XCircle className="size-6 shrink-0 text-red-600 dark:text-red-400" />
                <span className="text-base font-semibold">{t("statusRejected")}</span>
            </div>
        );
    }

    const currentIndex = STEPS.indexOf(status);

    return (
        <nav aria-label={t("trackingTitle")} className="w-full">
            {/* Mobile: vertical stepper */}
            <ol className="flex flex-col md:hidden">
                {STEPS.map((step, idx) => {
                    const isCompleted = idx < currentIndex;
                    const isCurrent = idx === currentIndex;
                    const isLast = idx === STEPS.length - 1;

                    return (
                        <li
                            key={step}
                            className="relative flex items-start gap-4"
                            {...(isCurrent ? { "aria-current": "step" } : {})}
                        >
                            {/* Circle and connecting line */}
                            <div className="flex flex-col items-center">
                                <div className="flex items-center justify-center">
                                    {isCompleted ? (
                                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-green-600 text-white dark:bg-green-500 shadow-sm">
                                            <Check className="size-4" strokeWidth={3} />
                                        </div>
                                    ) : isCurrent ? (
                                        <div
                                            className="flex size-9 shrink-0 items-center justify-center rounded-full border-4 border-green-600 bg-green-50 text-green-700 dark:border-green-400 dark:bg-green-950/80 dark:text-green-300 ring-4 ring-green-600/20"
                                            aria-current="step"
                                        >
                                            <div className="size-3 rounded-full bg-green-600 dark:bg-green-400" />
                                        </div>
                                    ) : (
                                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-muted-foreground/30 bg-muted" />
                                    )}
                                </div>
                                {!isLast && (
                                    <div
                                        className={cn(
                                            "my-1.5 w-0.5 min-h-7 flex-1",
                                            isCompleted ? "bg-green-600 dark:bg-green-500" : "bg-muted-foreground/25"
                                        )}
                                    />
                                )}
                            </div>

                            {/* Label */}
                            <div className={cn("pt-0.5 pb-5", isLast && "pb-0")}>
                                <span
                                    className={cn(
                                        "text-base block leading-snug",
                                        isCurrent && "font-bold text-foreground",
                                        isCompleted && "font-medium text-foreground",
                                        !isCompleted && !isCurrent && "font-normal text-muted-foreground"
                                    )}
                                >
                                    {t(statusKey[step])}
                                </span>
                            </div>
                        </li>
                    );
                })}
            </ol>

            {/* Desktop: horizontal stepper */}
            <ol className="hidden md:flex md:w-full md:items-start md:justify-between">
                {STEPS.map((step, idx) => {
                    const isCompleted = idx < currentIndex;
                    const isCurrent = idx === currentIndex;
                    const isLast = idx === STEPS.length - 1;

                    return (
                        <li
                            key={step}
                            className="relative flex flex-1 flex-col items-center"
                            {...(isCurrent ? { "aria-current": "step" } : {})}
                        >
                            {/* Horizontal connector line on left/right */}
                            <div className="flex w-full items-center">
                                <div
                                    className={cn(
                                        "h-0.5 flex-1",
                                        idx === 0
                                            ? "invisible"
                                            : isCompleted || isCurrent
                                            ? "bg-green-600 dark:bg-green-500"
                                            : "bg-muted-foreground/25"
                                    )}
                                />
                                <div className="flex shrink-0 items-center justify-center">
                                    {isCompleted ? (
                                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-green-600 text-white dark:bg-green-500 shadow-sm">
                                            <Check className="size-4" strokeWidth={3} />
                                        </div>
                                    ) : isCurrent ? (
                                        <div
                                            className="flex size-9 shrink-0 items-center justify-center rounded-full border-4 border-green-600 bg-green-50 text-green-700 dark:border-green-400 dark:bg-green-950/80 dark:text-green-300 ring-4 ring-green-600/20"
                                            aria-current="step"
                                        >
                                            <div className="size-3 rounded-full bg-green-600 dark:bg-green-400" />
                                        </div>
                                    ) : (
                                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-muted-foreground/30 bg-muted" />
                                    )}
                                </div>
                                <div
                                    className={cn(
                                        "h-0.5 flex-1",
                                        isLast
                                            ? "invisible"
                                            : isCompleted
                                            ? "bg-green-600 dark:bg-green-500"
                                            : "bg-muted-foreground/25"
                                    )}
                                />
                            </div>

                            {/* Label */}
                            <div className="mt-2.5 text-center px-1">
                                <span
                                    className={cn(
                                        "text-sm block leading-snug",
                                        isCurrent && "font-bold text-foreground",
                                        isCompleted && "font-medium text-foreground",
                                        !isCompleted && !isCurrent && "font-normal text-muted-foreground"
                                    )}
                                >
                                    {t(statusKey[step])}
                                </span>
                            </div>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
