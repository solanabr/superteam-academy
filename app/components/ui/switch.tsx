"use client";

import { forwardRef, type InputHTMLAttributes } from "react";

interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
	checked?: boolean;
	onCheckedChange?: (checked: boolean) => void;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
	({ checked, onCheckedChange, className = "", ...props }, ref) => {
		return (
			<button
				type="button"
				role="switch"
				aria-checked={checked}
				className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
					checked ? "bg-primary" : "bg-gray-200"
				} ${className}`}
				onClick={() => onCheckedChange?.(!checked)}
			>
				<input
					ref={ref}
					type="checkbox"
					className="sr-only"
					checked={checked}
					readOnly={true}
					{...props}
				/>
				<span
					className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
						checked ? "translate-x-6" : "translate-x-1"
					}`}
				/>
			</button>
		);
	}
);

Switch.displayName = "Switch";
