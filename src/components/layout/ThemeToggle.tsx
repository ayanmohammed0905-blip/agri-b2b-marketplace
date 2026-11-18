"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
    function toggle() {
        const isDark = document.documentElement.classList.toggle("dark");
        try {
            localStorage.setItem("theme", isDark ? "dark" : "light");
        } catch { }
    }

    return (
        <Button variant="outline" size="icon" onClick={toggle} aria-label="Toggle theme">
            <Sun className="hidden size-5 dark:block" />
            <Moon className="size-5 dark:hidden" />
        </Button>
    );
}