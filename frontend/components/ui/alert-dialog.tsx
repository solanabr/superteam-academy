"use client";

import type * as React from "react";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const AlertDialog = Dialog;
const AlertDialogTrigger = DialogTrigger;
const AlertDialogPortal = DialogPortal;
const AlertDialogOverlay = DialogOverlay;

function AlertDialogContent({
	className,
	...props
}: React.ComponentPropsWithoutRef<typeof DialogContent>) {
	return (
		<DialogContent
			className={cn("[&>button:last-child]:hidden", className)}
			onPointerDownOutside={(e) => e.preventDefault()}
			{...props}
		/>
	);
}

const AlertDialogHeader = DialogHeader;
const AlertDialogFooter = DialogFooter;
const AlertDialogTitle = DialogTitle;
const AlertDialogDescription = DialogDescription;

function AlertDialogAction({ className, ...props }: React.ComponentPropsWithoutRef<typeof Button>) {
	return (
		<DialogClose asChild>
			<Button className={className} {...props} />
		</DialogClose>
	);
}

function AlertDialogCancel({ className, ...props }: React.ComponentPropsWithoutRef<typeof Button>) {
	return (
		<DialogClose asChild>
			<Button variant="outline" className={className} {...props} />
		</DialogClose>
	);
}

export {
	AlertDialog,
	AlertDialogPortal,
	AlertDialogOverlay,
	AlertDialogTrigger,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogFooter,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogAction,
	AlertDialogCancel,
};
