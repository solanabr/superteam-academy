import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getCredentialById } from "@/lib/data";
import { CertificateClient } from "./certificate-client";

export default async function CertificatePage({
    params,
}: {
    params: Promise<{ locale: string; id: string }>;
}) {
    const { locale, id } = await params;
    setRequestLocale(locale);

    const credential = await getCredentialById(id);
    if (!credential) notFound();

    return <CertificateClient credential={credential} />;
}
