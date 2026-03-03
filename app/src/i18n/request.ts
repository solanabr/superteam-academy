import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";

import en from "../../messages/en.json";
import ptBR from "../../messages/pt-BR.json";
import es from "../../messages/es.json";

const messages: Record<string, typeof en> = {
    en,
    "pt-BR": ptBR,
    es,
};

export default getRequestConfig(async () => {
    const cookieStore = await cookies();
    const headerStore = await headers();

    let locale = cookieStore.get("locale")?.value;

    if (!locale) {
        const acceptLanguage = headerStore.get("accept-language") || "";
        if (acceptLanguage.includes("pt")) locale = "pt-BR";
        else if (acceptLanguage.includes("es")) locale = "es";
        else locale = "en";
    }

    const validLocales = ["en", "pt-BR", "es"];
    if (!validLocales.includes(locale)) locale = "en";

    return {
        locale,
        messages: messages[locale] || messages.en,
    };
});
