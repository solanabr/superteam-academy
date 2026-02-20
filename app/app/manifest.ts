import type { MetadataRoute } from "next";

const baseUrl = "https://brasil.superteam.life";

const { appName, description } = {
  appName: "Superteam Brasil",
  description:
    "Comunidade Solana no Brasil. Aprenda, construa e cresça no ecossistema Solana com cursos, bounties e uma rede de builders e criadores.",
};

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: appName,
    short_name: "Superteam BR",
    description,
    start_url: "/",
    scope: baseUrl,
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#9945FF",
    orientation: "portrait-primary",
    lang: "pt-BR",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
        purpose: "any",
      },
    ],
  };
}
