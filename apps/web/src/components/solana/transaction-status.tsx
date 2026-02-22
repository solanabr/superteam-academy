import * as React from "react"
import { ExternalLink, Loader2, CheckCircle2, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export type TransactionStatusType = "pending" | "success" | "failed" | "idle"

export function TransactionStatus({
  status,
  signature,
  message
}: {
  status: TransactionStatusType
  signature?: string
  message?: string
}) {
  if (status === "idle") return null

  const getStatusConfig = () => {
    switch (status) {
      case "pending":
        return {
          icon: <Loader2 className="h-6 w-6 animate-spin" strokeWidth={3} />,
          badgeVariant: "warning" as const,
          badgeText: "Pending",
          bgColor: "bg-warning/20",
        }
      case "success":
        return {
          icon: <CheckCircle2 className="h-6 w-6 text-secondary" strokeWidth={3} />,
          badgeVariant: "secondary" as const,
          badgeText: "Success",
          bgColor: "bg-secondary/20",
        }
      case "failed":
        return {
          icon: <XCircle className="h-6 w-6 text-destructive" strokeWidth={3} />,
          badgeVariant: "destructive" as const,
          badgeText: "Failed",
          bgColor: "bg-destructive/20",
        }
    }
  }

  const config = getStatusConfig()

  return (
    <div className={`flex flex-col gap-3 p-4 neo-brutal-border neo-brutal-shadow ${config.bgColor}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {config.icon}
          <span className="font-black uppercase tracking-tight">Transaction</span>
        </div>
        <Badge variant={config.badgeVariant}>{config.badgeText}</Badge>
      </div>
      
      {message && (
        <p className="text-sm font-bold opacity-80">{message}</p>
      )}

      {signature && (
        <a 
          href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-bold uppercase underline hover:text-primary transition-colors mt-2 w-fit"
        >
          View on Explorer
          <ExternalLink className="h-3 w-3" strokeWidth={3} />
        </a>
      )}
    </div>
  )
}
