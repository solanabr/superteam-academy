"use client"

import { signIn } from "next-auth/react"
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Github, Eye, EyeOff, Mail, Loader2 } from "lucide-react"
import { useI18n } from "@/components/providers/LocaleProvider"

const WalletSignIn = dynamic(
  () => import("@/components/WalletSignIn").then((m) => m.WalletSignIn),
  { ssr: false, loading: () => null }
)

export default function SignInPage() {
  const router = useRouter()
  const { t } = useI18n()
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)

  const [pwEmail, setPwEmail] = useState("")
  const [pwPassword, setPwPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState("")

  const [otpEmail, setOtpEmail] = useState("")
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState("")

  useEffect(() => {
    router.prefetch("/dashboard")
  }, [router])

  const handleOAuth = async (provider: string) => {
    setOauthLoading(provider)
    await signIn(provider, { callbackUrl: "/dashboard" })
    setOauthLoading(null)
  }

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError("")
    setPwLoading(true)
    try {
      const result = await signIn("email-password", {
        email: pwEmail.trim().toLowerCase(),
        password: pwPassword,
        redirect: false,
      })
      if (result?.error) {
        setPwError(t("auth.errors.invalidEmailPassword", "Invalid email or password."))
      } else {
        router.replace(result?.url ?? "/dashboard")
      }
    } catch {
      setPwError(t("auth.errors.generic", "Something went wrong. Please try again."))
    } finally {
      setPwLoading(false)
    }
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setOtpError("")
    setOtpLoading(true)
    try {
      const normalizedEmail = otpEmail.trim().toLowerCase()
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, type: "signin" }),
      })
      const data = await res.json()
      if (!res.ok) {
        setOtpError(data.error ?? t("auth.errors.sendCodeFailed", "Failed to send code."))
      } else {
        router.push(`/sign-in/verify?email=${encodeURIComponent(normalizedEmail)}`)
      }
    } catch {
      setOtpError(t("auth.errors.generic", "Something went wrong. Please try again."))
    } finally {
      setOtpLoading(false)
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
              {t("auth.signIn.title", "Welcome back")}
            </CardTitle>
            <CardDescription className="text-base">
              {t("auth.signIn.subtitle", "Sign in to continue your learning journey")}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">

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
                {oauthLoading === "github" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Github className="w-4 h-4" />
                )}
                {t("auth.providers.github", "GitHub")}
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-4 text-muted-foreground">
                  {t("auth.signIn.orEmail", "Or sign in with email")}
                </span>
              </div>
            </div>

            <Tabs defaultValue="password" className="w-full">
              <TabsList className="grid grid-cols-2 w-full h-11">
                <TabsTrigger value="password">{t("auth.common.password", "Password")}</TabsTrigger>
                <TabsTrigger value="otp">{t("auth.common.emailCode", "Email Code")}</TabsTrigger>
              </TabsList>

              {/* Password Tab */}
              <TabsContent value="password" className="mt-4">
                <form onSubmit={handlePasswordSignIn} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="pw-email">{t("auth.common.email", "Email")}</Label>
                    <Input
                      id="pw-email"
                      className="h-11"
                      type="email"
                      placeholder="you@example.com"
                      value={pwEmail}
                      onChange={(e) => setPwEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="pw-password">{t("auth.common.password", "Password")}</Label>
                    <div className="relative">
                      <Input
                        id="pw-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={pwPassword}
                        onChange={(e) => setPwPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        className="h-11 pr-10"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {pwError && (
                    <p className="text-sm text-destructive">{pwError}</p>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={pwLoading}
                  >
                    {pwLoading && (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    )}
                    {t("auth.common.signIn", "Sign In")}
                  </Button>
                </form>
              </TabsContent>

              {/* OTP Tab */}
              <TabsContent value="otp" className="mt-4">
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="otp-email">{t("auth.common.email", "Email")}</Label>
                    <Input
                      id="otp-email"
                      className="h-11"
                      type="email"
                      placeholder="you@example.com"
                      value={otpEmail}
                      onChange={(e) => setOtpEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>

                  {otpError && (
                    <p className="text-sm text-destructive">{otpError}</p>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={otpLoading}
                  >
                    {otpLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Mail className="w-4 h-4 mr-2" />
                    )}
                    {t("auth.signIn.sendCode", "Send Verification Code")}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {/* Wallet divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-4 text-muted-foreground">{t("auth.signIn.orWallet", "Or sign in with wallet")}</span>
              </div>
            </div>

            <WalletSignIn callbackUrl="/dashboard" />

            <p className="text-center text-sm text-muted-foreground">
              {t("auth.signIn.noAccount", "No account yet?")}{" "}
              <Link
                href="/sign-up"
                className="text-primary hover:text-primary/80 font-medium"
              >
                {t("auth.signIn.createFree", "Create one free")}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
  )
}
