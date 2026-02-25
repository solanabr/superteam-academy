import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    action?: ReactNode;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-4 px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-800">
                <Icon className="h-7 w-7 text-yellow-400" />
            </div>
            <div className="space-y-1">
                <h3 className="font-game text-2xl">{title}</h3>
                {description && (
                    <p className="max-w-sm font-game text-lg text-gray-400">
                        {description}
                    </p>
                )}
            </div>
            {action}
        </div>
    );
}
