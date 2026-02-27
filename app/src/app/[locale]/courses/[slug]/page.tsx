import { ContentService } from '@/lib/content';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Link } from '@/i18n/routing';
import { StartLearningButton } from '@/components/course/StartLearningButton';
import { CheckCircle, PlayCircle, Lock } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-states';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params;
  const course = await ContentService.getCourseBySlug(slug);

  if (!course) {
    return {
      title: 'Course Not Found',
    };
  }

  return {
    title: `${course.title} | Superteam Academy`,
    description: course.description,
    openGraph: {
      images: course.image ? [course.image] : [],
    },
  };
}

export default async function CourseDetailPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  if (!slug) notFound();
  const course = await ContentService.getCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  return (
    <div className="container mx-auto py-12 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-8 mb-12">
          {/* Cover Image */}
          <div className="w-full md:w-1/3 aspect-video relative rounded-lg overflow-hidden bg-gray-900 border border-[#2E2E36] shadow-2xl">
               {course.image ? (
                   <Image 
                       src={course.image} 
                       alt={course.title} 
                       fill
                       className="object-cover"
                       sizes="(max-width: 768px) 100vw, 33vw"
                       priority
                   />
               ) : (
                   <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] to-transparent opacity-60" />
               )}
               <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-xs font-bold text-[#14F195]">
                    +{course.xp} XP
               </div>
          </div>

          {/* Details */}
          <div className="flex-1">
              <div className="flex gap-2 mb-4">
                  {course.tags?.map(tag => (
                      <Badge key={tag} variant="secondary" className="bg-[#1E1E24] hover:bg-[#2E2E36]">{tag}</Badge>
                  ))}
              </div>
              <h1 className="text-4xl font-bold mb-4 text-white leading-tight">{course.title}</h1>
              <p className="text-gray-400 text-lg mb-6 leading-relaxed max-w-2xl">{course.description}</p>
              
              <div className="flex flex-wrap items-center gap-6 mb-8 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#14F195]" />
                      <span>{course.difficulty}</span>
                  </div>
                  <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#9945FF]" />
                      <span>{course.duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                       {/* Avatar */}
                       <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#9945FF] to-[#14F195] flex items-center justify-center text-[8px] font-bold text-black overflow-hidden">
                          ST
                       </div>
                       <span>By <span className="text-white font-medium">Superteam</span></span>
                  </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                  <StartLearningButton 
                     courseSlug={course.slug} 
                     firstLessonId={course.modules[0]?.lessons[0]?.id || 'intro'} 
                  />
                  {course.prerequisites && course.prerequisites.length > 0 && (
                      <div className="text-xs text-gray-500 self-center">
                          Prereqs: {course.prerequisites.join(', ')}
                      </div>
                  )}
              </div>
          </div>
      </div>

      {/* Curriculum */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Modules List */}
          <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <span className="bg-[#9945FF] w-1 h-6 rounded-full" />
                  Course Curriculum
              </h2>
              <Accordion type="single" collapsible className="w-full" defaultValue={course.modules[0]?.id || ""}>
                  {course.modules.length === 0 && <EmptyState icon={Lock} title="Coming Soon" description="Content is being prepared." />}
                  {course.modules.map((module, index) => (
                      <AccordionItem key={module.id || `module-${index}`} value={module.id || `module-${index}`} className="border-[#2E2E36] mb-4 overflow-hidden rounded-lg border bg-[#0F0F14]">
                          <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-[#1E1E24] transition-colors">
                              <div className="flex items-center gap-4 text-left">
                                  <div className="w-8 h-8 rounded-full bg-[#1E1E24] flex items-center justify-center text-sm font-bold text-gray-400 border border-[#2E2E36]">
                                      {index + 1}
                                  </div>
                                  <div>
                                      <div className="font-semibold text-white">{module.title}</div>
                                      <div className="text-xs text-gray-500">{module.lessons.length} lessons</div>
                                  </div>
                              </div>
                          </AccordionTrigger>
                          <AccordionContent className="bg-[#0A0A0F] px-0 pb-0 border-t border-[#2E2E36]">
                              {module.lessons.map(lesson => (
                                  <Link 
                                    key={lesson.id} 
                                    href={`/courses/${course.slug}/lessons/${lesson.id}`}
                                    className="flex items-center gap-4 p-4 hover:bg-[#1E1E24] border-b border-[#2E2E36] last:border-0 transition-colors group"
                                  >
                                      {lesson.type === 'video' ? (
                                          <PlayCircle className="h-4 w-4 text-gray-500 group-hover:text-[#9945FF] transition-colors" />
                                      ) : lesson.type === 'quiz' ? (
                                          <CheckCircle className="h-4 w-4 text-gray-500 group-hover:text-[#14F195] transition-colors" />
                                      ) : (
                                          <div className="w-4 h-4 rounded-full border-2 border-gray-600 group-hover:border-[#9945FF] transition-colors" />
                                      )}
                                      <span className="text-gray-300 group-hover:text-white transition-colors">{lesson.title}</span>
                                      
                                      <div className="ml-auto text-xs font-mono text-gray-500 group-hover:text-[#14F195] transition-colors">
                                          {lesson.xp} XP
                                      </div>
                                  </Link>
                              ))}
                          </AccordionContent>
                      </AccordionItem>
                  ))}
              </Accordion>
          </div>

          {/* Right Sidebar Info */}
          <div className="space-y-6">
              <div className="p-6 rounded-xl bg-[#16161c] border border-[#2E2E36]">
                  <h3 className="font-bold text-white mb-4">Instructor</h3>
                  <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#9945FF] to-[#14F195] p-[2px]">
                          <div className="w-full h-full rounded-full bg-[#0A0A0F] flex items-center justify-center overflow-hidden">
                              <span className="text-xs font-bold">ST</span>
                          </div>
                      </div>
                      <div>
                          <p className="font-semibold text-white">Superteam Brazil</p>
                          <p className="text-xs text-gray-400">Core Contributors</p>
                      </div>
                  </div>
                  <p className="text-sm text-gray-400 mt-4 leading-relaxed">
                      Built by the leading community of Solana developers in Brazil. We help you learn, build, and earn in the Solana ecosystem.
                  </p>
              </div>

              <div className="p-6 rounded-xl bg-[#16161c] border border-[#2E2E36]">
                  <h3 className="font-bold text-white mb-4">What you'll learn</h3>
                   <ul className="space-y-2 text-sm text-gray-400">
                       <li className="flex items-start gap-2">
                           <CheckCircle className="h-4 w-4 text-[#14F195] mt-0.5 shrink-0" />
                           <span>Build comprehensive Solana dApps</span>
                       </li>
                       <li className="flex items-start gap-2">
                           <CheckCircle className="h-4 w-4 text-[#14F195] mt-0.5 shrink-0" />
                           <span>Master Rust smart contracts</span>
                       </li>
                       <li className="flex items-start gap-2">
                           <CheckCircle className="h-4 w-4 text-[#14F195] mt-0.5 shrink-0" />
                           <span>Integrate wallets and tokens</span>
                       </li>
                   </ul>
              </div>
          </div>
      </div>
    </div>
  );
}
