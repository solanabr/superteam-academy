"use client"

import { useCallback, useState } from "react"
import Link from "next/link"
import { Share2, Download, BookOpen, Award, Loader2, CheckCircle2, ExternalLink } from "lucide-react"

import { Button } from "@/components/ui/button"
import { toast } from "sonner"

type CertificateActionsProps = {
  courseSlugOrId: string
  courseId: string
  allLessonsComplete: boolean
  credentialAlreadyMinted: boolean
  credentialExplorerUrl?: string
}

export function CertificateActions({
  courseSlugOrId,
  courseId,
  allLessonsComplete,
  credentialAlreadyMinted,
  credentialExplorerUrl,
}: CertificateActionsProps) {
  const [minting, setMinting] = useState(false)
  const [minted, setMinted] = useState(credentialAlreadyMinted)
  const [explorerUrl, setExplorerUrl] = useState(credentialExplorerUrl)

  const handleShare = useCallback(async () => {
    if (typeof window === "undefined") return

    const url = window.location.href
    const title = "Superteam Brazil Academy Certificate"

    if (navigator.share) {
      try {
        await navigator.share({ title, url })
        return
      } catch {
        // fall back to clipboard
      }
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url)
      toast.success("Certificate link copied to clipboard!")
    }
  }, [])

  const handleDownload = useCallback(async () => {
    if (typeof window === "undefined") return
    const element = document.getElementById("certificate-card")
    if (!element) return
    try {
      const { toPng } = await import("html-to-image")
      const dataUrl = await toPng(element, {
        cacheBust: true,
        pixelRatio: 2,
        style: { borderRadius: "0" },
      })
      const link = document.createElement("a")
      link.download = "superteam-brazil-certificate.png"
      link.href = dataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error("[download certificate]", err)
      toast.error("Download failed. Try again.")
    }
  }, [])

  const handleMint = useCallback(async () => {
    setMinting(true)
    try {
      const res = await fetch("/api/credentials/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? "Failed to mint credential")
        return
      }

      if (data.credentialMinted) {
        setMinted(true)
        if (data.explorerUrl) setExplorerUrl(data.explorerUrl)
        toast.success("Soulbound credential minted on Solana Devnet!")
      } else if (data.finalized) {
        toast.success("Course finalized on-chain! Credential NFT requires a collection address.")
      } else {
        toast.info(data.message ?? "No action taken")
      }
    } catch {
      toast.error("Network error. Please try again.")
    } finally {
      setMinting(false)
    }
  }, [courseId])

  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {/* Mint Credential button */}
      {minted ? (
        <Button
          variant="outline"
          className="border-primary/40 text-primary gap-2"
          asChild
        >
          <a href={explorerUrl} target="_blank" rel="noreferrer">
            <CheckCircle2 className="w-4 h-4" />
            Credential Minted
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
        </Button>
      ) : (
        <Button
          variant="default"
          className="gap-2 bg-primary hover:bg-primary/90"
          onClick={handleMint}
          disabled={minting || !allLessonsComplete}
          title={!allLessonsComplete ? "Complete all lessons to mint your credential" : undefined}
        >
          {minting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Minting…
            </>
          ) : (
            <>
              <Award className="w-4 h-4" />
              {allLessonsComplete ? "Mint Credential" : "Complete Course to Mint"}
            </>
          )}
        </Button>
      )}

      <Button variant="outline" className="border-border gap-2" onClick={handleShare}>
        <Share2 className="w-4 h-4" />
        Share
      </Button>
      <Button variant="outline" className="border-border gap-2" onClick={handleDownload}>
        <Download className="w-4 h-4" />
        Download
      </Button>
      <Link href={`/courses/${courseSlugOrId}`}>
        <Button variant="outline" className="border-border gap-2">
          <BookOpen className="w-4 h-4" />
          View Course
        </Button>
      </Link>
    </div>
  )
}
