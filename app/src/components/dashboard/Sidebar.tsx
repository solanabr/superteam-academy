import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export function Sidebar() {
    const t = useTranslations("components");
    return (
        <aside className="relative z-10 hidden md:flex w-64 flex-col border-r border-white/10 bg-void/80 backdrop-blur-md h-screen fixed left-0 top-0 bottom-0">
            <div className="p-6">
                <div className="flex items-center gap-3">
                    <div className="size-8 rounded bg-gradient-to-br from-solana to-emerald-800 flex items-center justify-center shadow-[0_0_10px_rgba(20,241,149,0.3)]">
                        <span className="material-symbols-outlined notranslate text-void font-bold text-lg">terminal</span>
                    </div>
                    <h1 className="font-display font-bold text-xl tracking-tight text-white">
                        {t("sidebar_brand").split(" ")[0]}<span className="text-solana"> {t("sidebar_brand").split(" ")[1]}</span>
                    </h1>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4">
                {/* Active Item */}
                <Link
                    href="/dashboard"
                    className="group flex items-center gap-3 px-3 py-3 rounded-r-lg border-l-2 border-solana bg-solana/5 text-white transition-all"
                >
                    <span className="material-symbols-outlined notranslate text-solana group-hover:text-white transition-colors">dashboard</span>
                    <span className="font-display font-medium text-sm">{t("sidebar_dashboard")}</span>
                </Link>

                {/* Inactive Items */}
                <Link
                    href="/courses"
                    className="group flex items-center gap-3 px-3 py-3 rounded-r-lg border-l-2 border-transparent hover:bg-white/5 hover:border-white/20 text-text-muted transition-all"
                >
                    <span className="material-symbols-outlined notranslate group-hover:text-white transition-colors">school</span>
                    <span className="font-display font-medium text-sm group-hover:text-white">{t("sidebar_courses")}</span>
                </Link>

                <Link
                    href="#"
                    className="group flex items-center gap-3 px-3 py-3 rounded-r-lg border-l-2 border-transparent hover:bg-white/5 hover:border-white/20 text-text-muted transition-all"
                >
                    <span className="material-symbols-outlined notranslate group-hover:text-white transition-colors">library_books</span>
                    <span className="font-display font-medium text-sm group-hover:text-white">{t("sidebar_library")}</span>
                </Link>

                <Link
                    href="/achievements"
                    className="group flex items-center gap-3 px-3 py-3 rounded-r-lg border-l-2 border-transparent hover:bg-white/5 hover:border-white/20 text-text-muted transition-all"
                >
                    <span className="material-symbols-outlined notranslate group-hover:text-white transition-colors">trophy</span>
                    <span className="font-display font-medium text-sm group-hover:text-white">{t("sidebar_achievements")}</span>
                </Link>
            </nav>

            <div className="p-4 border-t border-white/10">
                <Link
                    href="/settings"
                    className="group flex items-center gap-3 px-3 py-3 rounded-r-lg border-l-2 border-transparent hover:bg-white/5 hover:border-white/20 text-text-muted transition-all mb-2"
                >
                    <span className="material-symbols-outlined notranslate group-hover:text-white transition-colors">settings</span>
                    <span className="font-display font-medium text-sm group-hover:text-white">{t("sidebar_settings")}</span>
                </Link>

                <div className="flex items-center gap-3 px-3 py-3 mt-2 rounded-lg bg-white/5 border border-white/5">
                    <div className="size-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center border border-white/10">
                        <span className="font-mono text-xs text-white">DV</span>
                    </div>
                    <div className="flex flex-col overflow-hidden">
                        <p className="text-xs font-medium text-white truncate">DevUser</p>
                        <p className="text-[10px] font-mono text-solana truncate">0x3a...8f92</p>
                    </div>
                    <Button variant="ghost" size="icon" className="ml-auto text-text-muted hover:text-white transition-colors">
                        <span className="material-symbols-outlined notranslate text-sm">logout</span>
                    </Button>
                </div>
            </div>
        </aside>
    );
}
