import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export interface StatCardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
}

export function StatCard({ label, value, icon: Icon }: StatCardProps) {
    return (
        <Card>
            <CardContent className="flex items-center gap-4 p-6">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Icon className="size-6" />
                </div>
                <div className="flex flex-col">
                    <span className="text-3xl font-bold tracking-tight">{value}</span>
                    <span className="text-base text-muted-foreground">{label}</span>
                </div>
            </CardContent>
        </Card>
    );
}
