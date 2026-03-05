"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Brand = "brazil" | "solana";

const BrandContext = createContext<{ brand: Brand; setBrand: (brand: Brand) => void }>({
    brand: "brazil",
    setBrand: () => {},
});

export function BrandProvider({ children, defaultBrand = "brazil" }: { children: React.ReactNode; defaultBrand?: Brand }) {
    const [brand, setBrandState] = useState<Brand>(defaultBrand);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const stored = localStorage.getItem("app-brand") as Brand;
        if (stored === "brazil" || stored === "solana") {
            setBrandState(stored);
            document.documentElement.setAttribute("data-brand", stored);
        } else {
            document.documentElement.setAttribute("data-brand", defaultBrand);
        }
    }, [defaultBrand]);

    const setBrand = (b: Brand) => {
        setBrandState(b);
        localStorage.setItem("app-brand", b);
        document.documentElement.setAttribute("data-brand", b);
    };

    return <BrandContext.Provider value={{ brand, setBrand: mounted ? setBrand : () => {} }}>{children}</BrandContext.Provider>;
}

export const useBrand = () => useContext(BrandContext);
