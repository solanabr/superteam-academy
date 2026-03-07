import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-14 md:flex-row">
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          {t("builtBy")}
        </p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <a
            href="https://github.com/solanabr/superteam-academy"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            {t("github")}
          </a>
          <a
            href="https://x.com/SuperteamBR"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            {t("twitter")}
          </a>
          <a
            href="https://discord.gg/superteambrasil"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            {t("discord")}
          </a>
        </div>
      </div>
    </footer>
  );
}
