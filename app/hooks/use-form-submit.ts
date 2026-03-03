"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { postJson } from "@/lib/fetch-utils";

interface UseFormSubmitOptions {
	endpoint: string;
	successToast: { title: string; description: string };
	errorToast: { title: string; fallbackDescription: string };
	redirectTo?: string | ((data: Record<string, unknown>) => string);
}

export function useFormSubmit(options: UseFormSubmitOptions) {
	const { toast } = useToast();
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);

	const submit = useCallback(
		async (payload: Record<string, unknown>) => {
			setIsSubmitting(true);
			try {
				const { data, error } = await postJson<Record<string, unknown>>(
					options.endpoint,
					payload
				);

				if (error) throw error;

				toast({
					title: options.successToast.title,
					description: options.successToast.description,
				});

				if (options.redirectTo) {
					const path =
						typeof options.redirectTo === "function"
							? options.redirectTo(data ?? {})
							: options.redirectTo;
					router.push(path);
				}

				return data;
			} catch (err) {
				toast({
					title: options.errorToast.title,
					description:
						err instanceof Error ? err.message : options.errorToast.fallbackDescription,
					variant: "destructive",
				});
				return null;
			} finally {
				setIsSubmitting(false);
			}
		},
		[options, toast, router]
	);

	return { isSubmitting, submit };
}
