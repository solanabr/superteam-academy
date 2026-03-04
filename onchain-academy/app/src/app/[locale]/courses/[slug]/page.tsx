import { notFound } from "next/navigation";
import Image from "next/image";
import { mockCourses } from "@/domain/mock-data";
import { EnrollButton } from "@/components/wallet/enroll-button";
import { CurriculumList } from "@/components/course/curriculum-list";

type Props = {
  params: Promise<{ slug: string; locale: string }>;
};

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params;
  const course = mockCourses.find((c) => c.slug === slug);

  if (!course) {
    notFound();
  }

  return (
    <div className="bg-background min-h-screen pb-32 text-foreground">
      
      {/* Hero Asset Banner */}
      <div className="w-full h-[400px] md:h-[500px] relative bg-black">
        <Image
          src={course.thumbnailUrl || "https://images.unsplash.com/photo-1639762681485-074b7f4ec651?auto=format&fit=crop&q=80&w=2000&h=800"}
          alt={course.title}
          fill
          className="object-cover opacity-40"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="mx-auto max-w-[1024px] px-4 -mt-32 relative z-10">
        
        {/* Main Content Area */}
        <div className="bg-surface border border-white/10 rounded-[32px] p-8 md:p-16 apple-shadow mb-12">
          <div className="flex flex-col md:flex-row gap-12">
            
            {/* Left: Info */}
            <div className="flex-1">
              <div className="mb-8">
                <span className="inline-block px-4 py-1.5 bg-white/10 border border-white/10 text-white text-[13px] font-semibold rounded-full mb-6">
                  {course.difficulty} Level
                </span>
                <h1 className="text-[40px] md:text-[56px] font-bold tracking-tight text-white leading-[1.1] mb-6">
                  {course.title}
                </h1>
                <p className="text-[21px] text-white/70 leading-relaxed font-medium">
                  {course.description}
                </p>
              </div>
              
              <div className="flex items-center gap-6 py-8 border-y border-white/10 mb-8">
                <div>
                  <p className="text-[13px] text-white/50 mb-1 font-medium uppercase tracking-wider">Duration</p>
                  <p className="text-[17px] font-semibold text-white">{course.durationHours} Hours</p>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div>
                  <p className="text-[13px] text-white/50 mb-1 font-medium uppercase tracking-wider">Lessons</p>
                  <p className="text-[17px] font-semibold text-white">{course.lessons.length}</p>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div>
                  <p className="text-[13px] text-white/50 mb-1 font-medium uppercase tracking-wider">Reward</p>
                  <p className="text-[17px] font-semibold text-white">+{course.xpReward} XP</p>
                </div>
              </div>

              <div className="prose prose-invert prose-lg text-white/80 max-w-none prose-p:leading-relaxed prose-p:text-[17px]">
                <h3 className="text-[24px] font-bold tracking-tight mb-4 text-white">Overview</h3>
                <p>
                  This comprehensive path is designed to take you from foundational concepts to advanced production patterns on Solana. 
                  You will build real-world applications, understand the underlying architecture, and deploy your code to devnet.
                </p>
                <p>
                  By the end of this course, you will be eligible to mint an official on-chain credential, proving your mastery to the global ecosystem.
                </p>
              </div>
            </div>

            {/* Right: Action Card */}
            <div className="w-full md:w-[320px] shrink-0">
              <div className="sticky top-24 bg-background border border-white/10 rounded-[24px] p-8 text-center flex flex-col gap-6">
                <h4 className="text-[24px] font-bold tracking-tight text-white">Ready to begin?</h4>
                <p className="text-[15px] text-white/70">Join thousands of developers in this track.</p>
                <EnrollButton courseId={course.id} />
                <p className="text-[13px] text-white/50">Free forever. No credit card required.</p>
              </div>
            </div>

          </div>
        </div>

        {/* Curriculum */}
        <div className="bg-surface border border-white/10 rounded-[32px] p-8 md:p-16 apple-shadow">
          <h2 className="text-[32px] md:text-[40px] font-bold tracking-tight mb-12 text-white">Curriculum.</h2>
          <CurriculumList
            courseId={course.id}
            courseSlug={course.slug}
            courseXpReward={course.xpReward}
            lessons={course.lessons}
          />
        </div>

      </div>
    </div>
  );
}
