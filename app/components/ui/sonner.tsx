"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
	const { theme = "system" } = useTheme();

	return (
		<Sonner
			theme={theme as ToasterProps["theme"]}
			className="toaster group"
			toastOptions={{
				classNames: {
					toast:
						"group toast group-[.toaster]:!bg-bg-base group-[.toaster]:!text-ink-primary group-[.toaster]:!border-ink-secondary/20 group-[.toaster]:dark:!border-border group-[.toaster]:!shadow-lg group-[.toaster]:!font-mono group-[.toaster]:!uppercase group-[.toaster]:!tracking-wide group-[.toaster]:!rounded-none",
					description: "group-[.toast]:!text-ink-secondary",
					actionButton:
						"group-[.toast]:!bg-ink-primary group-[.toast]:!text-bg-base group-[.toaster]:!rounded-none group-[.toast]:font-bold",
					cancelButton:
						"group-[.toast]:!bg-muted group-[.toast]:!text-muted-foreground group-[.toaster]:!rounded-none",
				},
			}}
			{...props}
		/>
	);
};

export { Toaster };
