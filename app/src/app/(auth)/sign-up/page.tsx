"use client"

import { signIn } from "next-auth/react"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Github, Eye, EyeOff, Loader2, Mail } from "lucide-react"
import { useI18n } from "@/components/providers/LocaleProvider"

const WalletSignIn = dynamic(
  () => import("@/components/WalletSignIn").then((m) => m.WalletSignIn),
  { ssr: false, loading: () => null }
)

type Step = "details" | "verify"

export default function SignUpPage() {
  const router = useRouter()
  const { t } = useI18n()
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)
  const [step, setStep] = useState<Step>("details")

  // Step 1 — details
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [step1Loading, setStep1Loading] = useState(false)
  const [step1Error, setStep1Error] = useState("")

  // Step 2 — OTP
  const [otpCode, setOtpCode] = useState("") // stores full 6 digits
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState("")
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    router.prefetch("/dashboard")
  }, [router])

  const handleOAuth = async (provider: string) => {
    setOauthLoading(provider)
    await signIn(provider, { callbackUrl: "/dashboard" })
    setOauthLoading(null)
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setStep1Error("")

    if (password.length < 8) {
      setStep1Error(t("auth.errors.passwordMin", "Password must be at least 8 characters."))
      return
    }
    if (password !== confirmPassword) {
      setStep1Error(t("auth.errors.passwordMismatch", "Passwords do not match."))
      return
    }

    setStep1Loading(true)
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), type: "signup" }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStep1Error(data.error ?? t("auth.errors.sendCodeFailed", "Failed to send code. Try again."))
      } else {
        setOtpCode("")
        setOtpError("")
        setStep("verify")
        // focus first OTP box after render
        setTimeout(() => inputRefs.current[0]?.focus(), 0)
      }
    } catch {
      setStep1Error(t("auth.errors.generic", "Something went wrong. Please try again."))
    } finally {
      setStep1Loading(false)
    }
  }

  const verifyOtp = async (code: string) => {
    const cleaned = code.replace(/\D/g, "").slice(0, 6)
    if (cleaned.length !== 6) return

    setOtpError("")
    setOtpLoading(true)
    try {
      const result = await signIn("email-otp", {
        email: email.trim().toLowerCase(),
        otp: cleaned,
        name: name.trim(),
        password,
        callbackUrl: "/dashboard",
        redirect: false,
      })

      if (result?.error) {
        setOtpError(t("auth.errors.invalidCode", "Invalid or expired code."))
        setOtpCode("")
        inputRefs.current[0]?.focus()
        return
      }

      router.replace(result?.url || "/dashboard")
      router.refresh()
    } catch {
      setOtpError(t("auth.errors.generic", "Something went wrong. Please try again."))
    } finally {
      setOtpLoading(false)
    }
  }

  const handleOtpChange = (raw: string, index: number) => {
    // allow only 0-9, single char
    const value = raw.replace(/\D/g, "").slice(0, 1)

    const current = otpCode.padEnd(6, " ").split("")
    current[index] = value || " "
    const updated = current.join("").replace(/ /g, "")
    setOtpCode(updated)

    // move focus
    if (value && index < 5) inputRefs.current[index + 1]?.focus()

    // auto-verify when complete
    const filled = current.join("").replace(/ /g, "")
    if (filled.length === 6) verifyOtp(filled)
  }

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      const current = otpCode.padEnd(6, " ").split("")
      const hasValue = (current[index] ?? " ").trim().length > 0

      // if empty, move back
      if (!hasValue && index > 0) {
        inputRefs.current[index - 1]?.focus()
      }
    }

    if (e.key === "ArrowLeft" && index > 0) inputRefs.current[index - 1]?.focus()
    if (e.key === "ArrowRight" && index < 5) inputRefs.current[index + 1]?.focus()
  }

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (!pasted) return

    e.preventDefault()
    setOtpCode(pasted)

    // paint into boxes + focus last
    const lastIndex = Math.min(pasted.length - 1, 5)
    setTimeout(() => inputRefs.current[lastIndex]?.focus(), 0)

    if (pasted.length === 6) verifyOtp(pasted)
  }

  const handleResend = async () => {
    setOtpError("")
    setOtpCode("")
    await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase(), type: "signup" }),
    })
    setTimeout(() => inputRefs.current[0]?.focus(), 0)
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
          <span className="text-2xl font-bold tracking-tight text-primary">Superteam Academy</span>
        </Link>
      </div>

      <Card className="border-border shadow-lg md:p-4">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-3xl font-extrabold tracking-tight">
            {step === "details"
              ? t("auth.signUp.title", "Create your account")
              : t("auth.signUp.verifyTitle", "Enter code")}
          </CardTitle>
          <CardDescription className="text-base">
            {step === "details"
              ? t("auth.signUp.subtitle", "Free forever. No credit card required.")
              : (
                <>
                  {t("auth.signUp.sentCodePrefix", "We sent a 6-digit code to")}{" "}
                  <span className="font-medium text-foreground">{email}</span>
                </>
              )}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === "details" && (
            <>
              {/* OAuth Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-12 gap-2 text-sm font-medium"
                  onClick={() => handleOAuth("google")}
                  disabled={!!oauthLoading}
                >
                  {oauthLoading === "google" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  )}
                  {t("auth.providers.google", "Google")}
                </Button>

                <Button
                  variant="outline"
                  className="h-12 gap-2 text-sm font-medium"
                  onClick={() => handleOAuth("github")}
                  disabled={!!oauthLoading}
                >
                  {oauthLoading === "github" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Github className="w-4 h-4" />}
                  {t("auth.providers.github", "GitHub")}
                </Button>
              </div>

              {/* Wallet option */}
              <WalletSignIn callbackUrl="/dashboard" isSignUp />

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-4 text-muted-foreground">
                    {t("auth.signUp.orEmail", "Or sign up with email")}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">{t("auth.signUp.fullName", "Full name")}</Label>
                  <Input
                    id="name"
                    className="h-11"
                    type="text"
                    placeholder={t("auth.signUp.fullNamePlaceholder", "Your name")}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">{t("auth.common.email", "Email")}</Label>
                  <Input
                    id="email"
                    className="h-11"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="password">{t("auth.common.password", "Password")}</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder={t("auth.signUp.passwordPlaceholder", "Min 8 chars")}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        autoComplete="new-password"
                        className="pr-10 h-11"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirm-password">
                      {t("auth.signUp.confirmPassword", "Confirm")}
                    </Label>
                    <Input
                      id="confirm-password"
                      className="h-11"
                      type={showPassword ? "text" : "password"}
                      placeholder={t("auth.signUp.confirmPasswordPlaceholder", "Repeat password")}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                {step1Error && <p className="text-sm text-destructive">{step1Error}</p>}

                <Button
                  type="submit"
                  className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 text-base font-semibold"
                  disabled={step1Loading}
                >
                  {step1Loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
                  {t("auth.common.continue", "Continue")}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                {t("auth.signUp.alreadyHaveAccount", "Already have an account?")}{" "}
                <Link href="/sign-in" className="text-primary hover:text-primary/80 font-medium">
                  {t("auth.common.signIn", "Sign In")}
                </Link>
              </p>
            </>
          )}

          {step === "verify" && (
            <div className="space-y-6">
              {/* <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
              </div> */}

              {/* minimal label */}
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
                    disabled={otpLoading}
                    className="w-12 h-14 text-center text-xl font-semibold"
                  />
                ))}
              </div>

              {otpLoading && (
                <div className="flex justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              )}

              {otpError && <p className="text-sm text-destructive text-center">{otpError}</p>}

              <div className="flex items-center justify-between text-sm px-2">
                <button
                  type="button"
                  className="text-muted-foreground hover:text-primary font-medium"
                  onClick={() => {
                    setStep("details")
                    setOtpCode("")
                    setOtpError("")
                  }}
                  disabled={otpLoading}
                >
                  {t("auth.common.back", "Back")}
                </button>

                <button
                  type="button"
                  className="text-muted-foreground hover:text-primary font-medium"
                  onClick={handleResend}
                  disabled={otpLoading}
                >
                  {t("auth.common.resendCode", "Resend code")}
                </button>
              </div>

              {/* hidden submit for enter key users */}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  verifyOtp(otpCode)
                }}
                className="hidden"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
