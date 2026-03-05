import { setRequestLocale } from "next-intl/server";
import { HomeGateway } from "@/components/home-gateway";

export default async function HomePage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);

    return <HomeGateway />;
}
