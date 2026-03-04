import { db } from "@/drizzle/db"
import { CourseTable, CourseSectionTable, LessonTable, UserLessonCompleteTable } from "@/drizzle/schema"
import { eq, and, inArray, count } from "drizzle-orm"
import { notFound } from "next/navigation"
import { getCurrentUser } from "@/lib/current-user"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, CheckCircle, Zap } from "lucide-react"
import { CertificateActions } from "./CertificateActions"
import { getCredentialsByOwner } from "@/services/onchain"

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // id can be courseId — look up course + verify completion
  const [course, user] = await Promise.all([
    db.query.CourseTable.findFirst({ where: eq(CourseTable.id, id) }),
    getCurrentUser(),
  ])

  if (!course) notFound()

  // Fetch all public lesson IDs for this course
  const sections = await db.query.CourseSectionTable.findMany({
    where: eq(CourseSectionTable.courseId, course.id),
    columns: { id: true },
  })
  const sectionIds = sections.map((s) => s.id)

  let totalLessons = 0
  let completedLessons = 0

  if (sectionIds.length > 0) {
    const lessonRows = await db
      .select({ id: LessonTable.id })
      .from(LessonTable)
      .where(and(inArray(LessonTable.sectionId, sectionIds), eq(LessonTable.status, "public")))

    totalLessons = lessonRows.length
    const lessonIds = lessonRows.map((l) => l.id)

    if (user && lessonIds.length > 0) {
      const [row] = await db
        .select({ count: count() })
        .from(UserLessonCompleteTable)
        .where(
          and(
            eq(UserLessonCompleteTable.userId, user.id),
            inArray(UserLessonCompleteTable.lessonId, lessonIds)
          )
        )
      completedLessons = row?.count ?? 0
    }
  }

  const allLessonsComplete = totalLessons > 0 && completedLessons >= totalLessons

  const credentials = user?.walletAddress
    ? await getCredentialsByOwner(user.walletAddress)
    : []
  const matchedCredential = credentials.find((c) => {
    const track = c.attributes.track_id ?? c.attributes.track
    if (track == null) return false
    return String(track).toLowerCase() === String(course.track).toLowerCase()
  })

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Certificate Card */}
      <Card id="certificate-card" className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 overflow-hidden">
        {/* Header stripe */}
        <div className="h-2 bg-primary" />

        <CardContent className="p-8 text-center">
          {/* Logo / Badge */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-6 shadow-lg ">
            <Shield className="w-8 h-8 text-white" />
          </div>

          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-2">
            Certificate of Completion
          </p>
          <h1 className="text-2xl font-bold mb-6">{course.name}</h1>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <CheckCircle className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Course Completed</span>
          </div>

          {/* Course Details */}
          <div className="grid grid-cols-3 gap-4 mb-8 p-4 bg-background/40 rounded-xl">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Track</p>
              <p className="text-sm font-semibold capitalize">{course.track}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Difficulty</p>
              <p className="text-sm font-semibold capitalize">{course.difficulty}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">XP Earned</p>
              <p className="text-sm font-semibold text-primary">{course.xpReward}</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-px h-8 bg-border" />
            <div className="text-center px-4">
              <p className="text-xs text-muted-foreground">Issued by</p>
              <p className="text-sm font-bold">Superteam Brazil Academy</p>
            </div>
            <div className="w-px h-8 bg-border" />
          </div>

          {/* On-chain credential */}
          <div className="bg-background/60 border border-border rounded-xl p-4 mb-6 text-left">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-primary" />
              <p className="text-sm font-semibold">On-Chain Credential</p>
              <Badge
                variant="outline"
                className={`text-xs ${matchedCredential ? "border-primary/30 text-primary" : "border-orange-500/30 text-orange-400"}`}
              >
                {matchedCredential ? "Verified on Devnet" : "Not found yet"}
              </Badge>
            </div>
            {!user?.walletAddress ? (
              <p className="text-xs text-muted-foreground">
                Link a wallet in settings to verify your soulbound Metaplex Core credential.
              </p>
            ) : matchedCredential ? (
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5" />
                  <span className="font-mono">Asset: {matchedCredential.id.slice(0, 6)}...{matchedCredential.id.slice(-6)}</span>
                </div>
                <a
                  className="text-primary hover:text-primary/80 underline"
                  href={matchedCredential.explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  View on Solana Explorer
                </a>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No credential NFT found for this track yet. Finish finalization/issuance flow to mint it.
              </p>
            )}
          </div>

          <CertificateActions
            courseSlugOrId={course.slug ?? course.id}
            courseId={course.id}
            allLessonsComplete={allLessonsComplete}
            credentialAlreadyMinted={!!matchedCredential}
            credentialExplorerUrl={matchedCredential?.explorerUrl}
          />
        </CardContent>
      </Card>

      {/* Verification Info */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <h2 className="font-semibold mb-4">Verification</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Platform Verified</p>
                <p className="text-muted-foreground text-xs">Completion recorded in Superteam Academy database</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-muted-foreground">On-chain Verification</p>
                <p className="text-muted-foreground text-xs">
                  Soulbound NFT credential on Solana Devnet — available after wallet connection
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
