import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/drizzle/db"
import { UserTable, VerificationTokenTable } from "@/drizzle/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { sendEmail } from "@/lib/email"

import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// --- Rate limit config ---
// Tune these to your product needs.
// 1) per IP: protects infrastructure from abuse
// 2) per email: protects users from being spammed (email-bombing)
const redis = Redis.fromEnv()
const ratelimitIP = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 requests per minute per IP
  analytics: true,
})
const ratelimitEmail = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "10 m"), // 3 OTP emails per 10 minutes per email
  analytics: true,
})

function getClientIp(req: NextRequest) {
  // Vercel/Proxy typically sets x-forwarded-for
  const xff = req.headers.get("x-forwarded-for")
  if (xff) return xff.split(",")[0]!.trim()
  // NextRequest may have req.ip in some runtimes
  // @ts-expect-error - req.ip is runtime-dependent
  return req.ip ?? "unknown"
}

function generateOTP(): string {
  // 6-digit numeric code
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Strong validation: email format + max length + type enum
const bodySchema = z.object({
  email: z
    .string()
    .trim()
    .min(3, "Email is required")
    .max(254, "Email is too long")
    .email("Invalid email"),
  type: z.enum(["signin", "signup"]),
})

export async function POST(req: NextRequest) {
  try {
    // 1) Parse & validate body
    const json = await req.json().catch(() => null)
    const parsed = bodySchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const normalizedEmail = parsed.data.email.toLowerCase()
    const type = parsed.data.type

    // 2) Rate limit (IP + Email)
    const ip = getClientIp(req)

    const [ipLimit, emailLimit] = await Promise.all([
      ratelimitIP.limit(`otp:ip:${ip}`),
      ratelimitEmail.limit(`otp:email:${normalizedEmail}`),
    ])

    if (!ipLimit.success || !emailLimit.success) {
      const retryAfterSeconds = Math.max(
        ipLimit.success ? 0 : Math.ceil((ipLimit.reset - Date.now()) / 1000),
        emailLimit.success ? 0 : Math.ceil((emailLimit.reset - Date.now()) / 1000)
      )

      return new NextResponse(
        JSON.stringify({
          error: "Too many requests. Please try again shortly.",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(Math.max(1, retryAfterSeconds)),
          },
        }
      )
    }

    // 3) Business rule: sign-in requires existing user
    if (type === "signin") {
      const user = await db.query.UserTable.findFirst({
        where: eq(UserTable.email, normalizedEmail),
        columns: { id: true },
      })

      if (!user) {
        return NextResponse.json(
          { error: "Email does not exist. Please create an account first." },
          { status: 404 }
        )
      }
    }

    if (type === "signup") {
      const existingUser = await db.query.UserTable.findFirst({
        where: eq(UserTable.email, normalizedEmail),
        columns: { id: true },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: "Email already exists. Please sign in instead." },
          { status: 409 }
        )
      }
    }

    // 4) Generate OTP + store hashed token with expiry
    const otp = generateOTP()
    const hashedOtp = await bcrypt.hash(otp, 10)
    const expires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    const identifier = `otp:${normalizedEmail}`

    await db.delete(VerificationTokenTable).where(eq(VerificationTokenTable.identifier, identifier))

    await db.insert(VerificationTokenTable).values({
      identifier,
      token: hashedOtp,
      expires,
    })

    // 5) Send email
    const emailResult = await sendEmail({
      to: normalizedEmail,
      subject: "Your Superteam Brazil Academy verification code",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #ffffff;">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-flex; align-items: center; gap: 8px;">
              <div style="background: #9945FF; border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 18px; font-weight: bold;">S</span>
              </div>
              <span style="font-size: 18px; font-weight: 700; color: #9945FF;">Superteam Brazil Academy</span>
            </div>
          </div>

          <h1 style="font-size: 24px; font-weight: 700; color: #111827; text-align: center; margin-bottom: 8px;">
            ${type === "signup" ? "Verify your email" : "Sign in code"}
          </h1>
          <p style="color: #6B7280; text-align: center; margin-bottom: 32px;">
            ${type === "signup"
              ? "Enter this code to complete your account creation."
              : "Enter this code to sign in to your account."}
          </p>

          <div style="background: #F5F0FF; border: 2px solid #9945FF; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 40px; font-weight: 800; letter-spacing: 12px; color: #9945FF; font-family: monospace;">
              ${otp}
            </span>
          </div>

          <p style="color: #9CA3AF; font-size: 13px; text-align: center;">
            This code expires in <strong>10 minutes</strong>. If you didn't request this, you can ignore this email.
          </p>
        </div>
      `,
    })

    if (!emailResult.success) {
      console.error("send-otp email provider error:", emailResult.error)
      return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    // Log full error server-side for debugging
    console.error("send-otp error:", err)
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 })
  }
}
