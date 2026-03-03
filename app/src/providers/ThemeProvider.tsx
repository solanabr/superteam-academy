"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: "light",
    toggleTheme: () => { },
});

export function useTheme() {
    return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>("light");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem("theme") as Theme | null;
        if (stored === "dark" || stored === "light") {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setTheme(stored);
        } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setTheme("dark");
        }
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
    }, [theme, mounted]);

    function toggleTheme() {
        setTheme((prev) => (prev === "light" ? "dark" : "light"));
    }

    // Prevent flash of wrong theme
    if (!mounted) {
        return <>{children}</>;
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
