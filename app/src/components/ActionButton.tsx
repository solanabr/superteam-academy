"use client";

import { ComponentPropsWithRef, ReactNode, useTransition } from "react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogContent,
  AlertDialogTrigger,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "./ui/alert-dialog";

export function ActionButton({
  action,
  requireAreYouSure = false,
  ...props
}: Omit<ComponentPropsWithRef<typeof Button>, "onClick"> & {
  action: () => Promise<{ error: boolean; message: string }>;
  requireAreYouSure?: boolean;
}) {
  {
    const [isLoading, startTransition] = useTransition();

    function performAction() {
      startTransition(async () => {
        const data = await action();
        if (data.error) {
          toast.error(data.message);
        } else {
          toast.success(data.message);
        }
      });
    }

    if (requireAreYouSure) {
      return (
        <AlertDialog open={isLoading ? true : undefined}>
          <AlertDialogTrigger asChild>
            <Button {...props} />
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction disabled={isLoading} onClick={performAction}>
                <LoadingTextSwap isLoading={isLoading}>Yes</LoadingTextSwap>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    }

    return (
      <Button {...props} disabled={isLoading} onClick={performAction}>
        <LoadingTextSwap isLoading={isLoading}>
          {props.children}
        </LoadingTextSwap>
      </Button>
    );
  }
}

function LoadingTextSwap({
  isLoading,
  children,
}: {
  isLoading: boolean;
  children: ReactNode;
}) {
  return (
    <div className="grid items-center justify-items-center">
      <div
        className={cn(
          "col-start-1 col-end-2 row-start-1 row-end-2",
          isLoading ? "invisible" : "visible"
        )}
      >
        {children}
      </div>
      <div
        className={cn(
          "col-start-1 col-end-2 row-start-1 row-end-2 text-center",
          isLoading ? "visible" : "invisible"
        )}
      >
        <Loader2Icon className="animate-spin" />
      </div>
    </div>
  );
}
