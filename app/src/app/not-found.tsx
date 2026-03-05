import Link from "next/link";
import { routing } from "@/i18n/routing";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground drop-shadow-md">
          404
        </h1>
        <p className="mt-2 text-muted-foreground">Página não encontrada.</p>
      </div>
      <Link
        href={`/${routing.defaultLocale}`}
        className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Voltar ao início
      </Link>
    </div>
  );
}
