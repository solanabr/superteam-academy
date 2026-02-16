import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CtaSection() {
  return (
    <section className="border-t border-border bg-card/30 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-foreground lg:text-4xl text-balance">
            Ready to Build the Future?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            Join thousands of developers learning blockchain development. Start
            your first course for free today.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/courses">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 px-8 h-12 text-base glow-green"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/courses">
              <Button
                variant="outline"
                size="lg"
                className="border-border text-foreground hover:bg-secondary h-12 text-base"
              >
                View All Courses
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
