import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import PublicProfileClient from "./public-profile-client";

type Props = { params: { locale: string; address: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { address } = await params;
  const short = `${address.slice(0, 4)}...${address.slice(-4)}`;
  return {
    title: `${short} — Superteam Academy`,
    description: `View learner profile and on-chain credentials for ${short}`,
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { locale, address } = await params;
  setRequestLocale(locale);
  return <PublicProfileClient address={address} />;
}
