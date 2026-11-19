"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sprout, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useAuth, homePathForRole } from "@/lib/auth/AuthProvider";

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const { t } = useLanguage();
    const { user, loading, logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        setIsOpen(false);
        await logout();
        router.push("/");
    };

    const dashboardHref = user ? homePathForRole(user.role) : "/farmer/dashboard";

    return (
        <header className="sticky top-0 z-50 border-b border-white/10 bg-brand-dark text-white">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
                {/* Left */}
                <Link
                    href="/"
                    className="flex items-center gap-2.5"
                    onClick={() => setIsOpen(false)}
                >
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Sprout className="size-5" />
                    </div>
                    <span className="font-semibold">{t("appName")}</span>
                </Link>

                {/* Middle (hidden below md) */}
                <div className="hidden md:flex items-center gap-3 lg:gap-5">
                    {!user && (
                        <Link href="/" className="text-sm text-white/80 hover:text-white whitespace-nowrap">
                            {t("home")}
                        </Link>
                    )}
                    <Link
                        href="/buyer/marketplace"
                        className="text-sm text-white/80 hover:text-white whitespace-nowrap"
                    >
                        {t("marketplace")}
                    </Link>
                    <Link
                        href={dashboardHref}
                        className="text-sm text-white/80 hover:text-white whitespace-nowrap"
                    >
                        {t("dashboard")}
                    </Link>
                    {user && user.role === "farmer" && (
                        <>
                            <Link
                                href="/farmer/dashboard"
                                className="text-sm text-white/80 hover:text-white whitespace-nowrap"
                            >
                                {t("myListings")}
                            </Link>
                            <Link
                                href="/farmer/listings/new"
                                className="text-sm text-white/80 hover:text-white whitespace-nowrap"
                            >
                                {t("addCrop")}
                            </Link>
                            <Link
                                href="/farmer/orders"
                                className="text-sm text-white/80 hover:text-white whitespace-nowrap"
                            >
                                {t("viewOrders")}
                            </Link>
                        </>
                    )}
                    {user && user.role === "buyer" && (
                        <Link
                            href="/buyer/orders"
                            className="text-sm text-white/80 hover:text-white whitespace-nowrap"
                        >
                            {t("viewOrders")}
                        </Link>
                    )}
                    {user && (
                        <Link
                            href="/profile"
                            className="text-sm text-white/80 hover:text-white whitespace-nowrap"
                        >
                            {t("profile")}
                        </Link>
                    )}
                </div>

                {/* Right (hidden below md) */}
                <div className="hidden md:flex items-center gap-3">
                    <ThemeToggle />
                    <LanguageSwitcher />
                    {!loading && (
                        user ? (
                            <>
                                <span className="text-sm font-medium text-white/90 truncate max-w-[150px]">
                                    {user.name}
                                </span>
                                <Button variant="outline" onClick={handleLogout}>
                                    {t("logout")}
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button variant="outline" asChild>
                                    <Link href="/login">{t("login")}</Link>
                                </Button>
                                <Button asChild>
                                    <Link href="/register">{t("register")}</Link>
                                </Button>
                            </>
                        )
                    )}
                </div>

                {/* Mobile Menu Button */}
                <Button
                    variant="outline"
                    size="icon"
                    className="min-h-[44px] min-w-[44px] md:hidden"
                    onClick={() => setIsOpen((prev) => !prev)}
                    aria-label={t("menu")}
                >
                    <Menu className="size-5" />
                </Button>
            </div>

            {/* Mobile Dropdown Panel */}
            {isOpen && (
                <div className="border-b border-white/10 bg-brand-dark px-4 py-4 md:hidden">
                    <nav className="flex flex-col gap-1">
                        {!user && (
                            <Link
                                href="/"
                                onClick={() => setIsOpen(false)}
                                className="flex min-h-[44px] items-center text-sm text-white/80 hover:text-white"
                            >
                                {t("home")}
                            </Link>
                        )}
                        <Link
                            href="/buyer/marketplace"
                            onClick={() => setIsOpen(false)}
                            className="flex min-h-[44px] items-center text-sm text-white/80 hover:text-white"
                        >
                            {t("marketplace")}
                        </Link>
                        <Link
                            href={dashboardHref}
                            onClick={() => setIsOpen(false)}
                            className="flex min-h-[44px] items-center text-sm text-white/80 hover:text-white"
                        >
                            {t("dashboard")}
                        </Link>

                        {user && user.role === "farmer" && (
                            <>
                                <Link
                                    href="/farmer/dashboard"
                                    onClick={() => setIsOpen(false)}
                                    className="flex min-h-[44px] items-center text-sm text-white/80 hover:text-white"
                                >
                                    {t("myListings")}
                                </Link>
                                <Link
                                    href="/farmer/listings/new"
                                    onClick={() => setIsOpen(false)}
                                    className="flex min-h-[44px] items-center text-sm text-white/80 hover:text-white"
                                >
                                    {t("addCrop")}
                                </Link>
                                <Link
                                    href="/farmer/orders"
                                    onClick={() => setIsOpen(false)}
                                    className="flex min-h-[44px] items-center text-sm text-white/80 hover:text-white"
                                >
                                    {t("viewOrders")}
                                </Link>
                            </>
                        )}

                        {user && user.role === "buyer" && (
                            <Link
                                href="/buyer/orders"
                                onClick={() => setIsOpen(false)}
                                className="flex min-h-[44px] items-center text-sm text-white/80 hover:text-white"
                            >
                                {t("viewOrders")}
                            </Link>
                        )}

                        {user && (
                            <Link
                                href="/profile"
                                onClick={() => setIsOpen(false)}
                                className="flex min-h-[44px] items-center text-sm text-white/80 hover:text-white"
                            >
                                {t("profile")}
                            </Link>
                        )}

                        <div className="my-2 border-t border-white/10" />

                        <div className="flex min-h-[44px] items-center gap-3">
                            <ThemeToggle />
                            <LanguageSwitcher />
                        </div>

                        <div className="my-2 border-t border-white/10" />

                        {!loading && (
                            <div className="flex flex-col gap-2">
                                {user ? (
                                    <>
                                        <div className="flex min-h-[44px] items-center px-1 text-sm font-medium text-white/90">
                                            {user.name}
                                        </div>
                                        <Button
                                            variant="outline"
                                            className="min-h-[44px] w-full justify-center"
                                            onClick={handleLogout}
                                        >
                                            {t("logout")}
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            variant="outline"
                                            asChild
                                            className="min-h-[44px] w-full justify-center"
                                        >
                                            <Link href="/login" onClick={() => setIsOpen(false)}>
                                                {t("login")}
                                            </Link>
                                        </Button>
                                        <Button asChild className="min-h-[44px] w-full justify-center">
                                            <Link href="/register" onClick={() => setIsOpen(false)}>
                                                {t("register")}
                                            </Link>
                                        </Button>
                                    </>
                                )}
                            </div>
                        )}
                    </nav>
                </div>
            )}
        </header>
    );
}
