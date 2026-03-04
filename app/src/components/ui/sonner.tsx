"use client"

import { useTheme } from "next-themes"
import { Toaster, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Toaster>

const AppToaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Toaster
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

function actionToast({
  actionData,
  ...props
}: {
  actionData: { error: boolean; message: string }
  duration?: number
  id?: string
}) {
  const isError = actionData.error

  return toast(
    <div className="space-y-1">
      <p className={`font-semibold ${isError ? "text-red-500" : "text-green-500"}`}>
        {isError ? "Error" : "Success"}
      </p>
      <p>{actionData.message}</p>
    </div>,
    {
      duration: props.duration ?? 3000,
      id: props.id,
    }
  )
}

export { AppToaster as Toaster, actionToast }
