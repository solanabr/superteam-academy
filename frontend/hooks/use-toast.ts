import { useState, useCallback } from "react";

interface ToastProps {
	title: string;
	description?: string;
	variant?: "default" | "destructive";
	duration?: number;
}

interface Toast extends ToastProps {
	id: string;
}

export function useToast() {
	const [toasts, setToasts] = useState<Toast[]>([]);

	const toast = useCallback((props: ToastProps) => {
		const id = Math.random().toString(36).slice(2);
		const newToast: Toast = { ...props, id };
		setToasts((prev) => [...prev, newToast]);

		setTimeout(() => {
			setToasts((prev) => prev.filter((t) => t.id !== id));
		}, props.duration ?? 5000);

		return id;
	}, []);

	const dismiss = useCallback((id: string) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
	}, []);

	return { toast, toasts, dismiss };
}
