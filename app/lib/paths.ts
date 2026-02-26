const PATHNAMES: Record<string, Record<string, string>> = {
  "/courses": { "pt-BR": "/cursos", en: "/courses", es: "/cursos" },
  "/dashboard": { "pt-BR": "/painel", en: "/dashboard", es: "/panel" },
  "/leaderboard": { "pt-BR": "/classificacao", en: "/leaderboard", es: "/clasificacion" },
  "/settings": { "pt-BR": "/configuracoes", en: "/settings", es: "/configuracion" },
  "/profile": { "pt-BR": "/perfil", en: "/profile", es: "/perfil" },
  "/certificates": { "pt-BR": "/certificados", en: "/certificates", es: "/certificados" },
  "/challenges": { "pt-BR": "/desafios", en: "/challenges", es: "/desafios" },
  "/lessons": { "pt-BR": "/aulas", en: "/lessons", es: "/lecciones" },
  "/community": { "pt-BR": "/comunidade", en: "/community", es: "/comunidad" },
  "/admin": { "pt-BR": "/admin", en: "/admin", es: "/admin" },
  "/onboarding": { "pt-BR": "/boas-vindas", en: "/onboarding", es: "/bienvenida" },
  "/teach": { "pt-BR": "/ensinar", en: "/teach", es: "/ensenar" },
};

export function localePath(locale: string, canonicalPath: string): string {
  for (const [canonical, localized] of Object.entries(PATHNAMES)) {
    if (canonicalPath === canonical || canonicalPath.startsWith(canonical + "/")) {
      const suffix = canonicalPath.slice(canonical.length);
      const base = localized[locale] ?? localized["pt-BR"];
      return `/${locale}${base}${suffix}`;
    }
  }
  return `/${locale}${canonicalPath}`;
}
