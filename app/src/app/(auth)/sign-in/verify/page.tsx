"use client"

import { signIn } from "next-auth/react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { FormEvent, useMemo, useRef, useState } from "react"
import { Loader2, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useI18n } from "@/components/providers/LocaleProvider"

export default function SignInVerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useI18n()

  const email = useMemo(() => (searchParams.get("email") ?? "").trim().toLowerCase(), [searchParams])
  const [otpCode, setOtpCode] = useState("")
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const handleOtpChange = (raw: string, index: number) => {
    const value = raw.replace(/\D/g, "").slice(0, 1)
    const current = otpCode.padEnd(6, " ").split("")
    current[index] = value || " "
    const updated = current.join("").replace(/ /g, "")
    setOtpCode(updated)

    if (value && index < 5) inputRefs.current[index + 1]?.focus()
  }

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      const current = otpCode.padEnd(6, " ").split("")
      const hasValue = (current[index] ?? " ").trim().length > 0
      if (!hasValue && index > 0) inputRefs.current[index - 1]?.focus()
    }

    if (e.key === "ArrowLeft" && index > 0) inputRefs.current[index - 1]?.focus()
    if (e.key === "ArrowRight" && index < 5) inputRefs.current[index + 1]?.focus()
  }

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (!pasted) return
    e.preventDefault()
    setOtpCode(pasted)
    const lastIndex = Math.min(pasted.length - 1, 5)
    setTimeout(() => inputRefs.current[lastIndex]?.focus(), 0)
  }

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault()
    if (!email) {
      setError(t("auth.signInVerify.missingEmail", "Missing email. Go back and request a new code."))
      return
    }

    setError("")
    setMessage("")
    setLoading(true)
    try {
      const result = await signIn("email-otp", {
        email,
        otp: otpCode.trim(),
        callbackUrl: "/dashboard",
        redirect: false,
      })

      if (result?.error) {
        setError(t("auth.errors.invalidCodeRetry", "Invalid or expired code. Please try again."))
      } else {
        router.replace(result?.url || "/dashboard")
        router.refresh()
      }
    } catch {
      setError(t("auth.errors.generic", "Something went wrong. Please try again."))
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email) {
      setError(t("auth.signInVerify.missingEmail", "Missing email. Go back and request a new code."))
      return
    }

    setError("")
    setMessage("")
    setOtpCode("")
    setResendLoading(true)
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: "signin" }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? t("auth.errors.resendFailed", "Failed to resend code."))
      } else {
        setMessage(t("auth.signInVerify.codeResent", "A new code has been sent."))
        setTimeout(() => inputRefs.current[0]?.focus(), 0)
      }
    } catch {
      setError(t("auth.errors.generic", "Something went wrong. Please try again."))
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="w-full max-w-lg">
      <div className="text-center mb-10">
        <Link href="/" className="inline-flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-primary/10 ring-1 ring-border shadow-sm">
            <Image
              src="/imgs/logo.png"
              alt="Superteam Academy logo"
              width={48}
              height={48}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <span className="text-2xl font-bold tracking-tight text-primary">
            Superteam Academy
          </span>
        </Link>
      </div>

      <Card className="border-border shadow-lg md:p-4">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-3xl font-extrabold tracking-tight">
            {t("auth.signInVerify.title", "Verify your code")}
          </CardTitle>
          <CardDescription className="text-base">
            {email
              ? (
                <>
                  {t("auth.signInVerify.subtitlePrefix", "Enter the 6-digit code sent to")}{" "}
                  <span className="font-medium text-foreground">{email}</span>
                </>
              )
              : t("auth.signInVerify.subtitleFallback", "Enter the code from your email.")}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-1.5 mb-2">
              {/* <Label>6-digit code</Label> */}
              <div
                className="flex justify-center gap-2"
                aria-label={t("auth.common.enterVerificationCode", "Enter verification code")}
              >
                {[...Array(6)].map((_, i) => (
                  <Input
                    key={i}
                    ref={(el) => {
                      inputRefs.current[i] = el
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete={i === 0 ? "one-time-code" : "off"}
                    maxLength={1}
                    value={otpCode[i] ?? ""}
                    onChange={(e) => handleOtpChange(e.target.value, i)}
                    onKeyDown={(e) => handleOtpKeyDown(e, i)}
                    onPaste={handleOtpPaste}
                    disabled={loading}
                    className="w-12 h-14 text-center text-xl font-semibold"
                    autoFocus={i === 0}
                  />
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {message && <p className="text-sm text-emerald-600 dark:text-emerald-400">{message}</p>}

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={loading || otpCode.length !== 6}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {t("auth.signInVerify.verifyCta", "Verify Code")}
            </Button>
          </form>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              className="text-muted-foreground hover:text-primary font-medium"
              onClick={() => router.replace("/sign-in")}
              disabled={loading || resendLoading}
            >
              {t("auth.signInVerify.useDifferentEmail", "Use a different email")}
            </button>

            <button
              type="button"
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary font-medium disabled:opacity-50"
              onClick={handleResend}
              disabled={loading || resendLoading || !email}
            >
              {resendLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              {t("auth.common.resendCode", "Resend code")}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
