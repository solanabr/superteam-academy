import Link from "next/link";
export interface LessonSidebarItem {
   id: number;
   title: string;
   active: boolean;
   done: boolean;
}

interface Props {
   moduleName: string;
   courseSlug: string;
   sidebarOpen: boolean;
   setSidebarOpen: (open: boolean) => void;
   lessons: LessonSidebarItem[];
}

export default function LessonSidebar({ moduleName, courseSlug, sidebarOpen, setSidebarOpen, lessons }: Props) {
   return (
      <aside className={[
         "absolute lg:relative z-20 h-full w-64 bg-sol-surface border-r border-sol-border",
         "shrink-0 flex flex-col transition-transform duration-200",
         sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      ].join(" ")}>
         <div className="px-4 py-3 border-b border-sol-border">
            <div className="text-[10px] font-bold text-sol-muted uppercase tracking-widest mb-0.5">Module</div>
            <div className="text-sm font-semibold text-sol-text">{moduleName}</div>
         </div>
         <div className="flex-1 overflow-y-auto py-2">
            {lessons.map(l => (
               <Link key={l.id}
                  href={`/courses/${courseSlug}/lessons/${l.id}`}
                  onClick={() => setSidebarOpen(false)}
                  className={[
                     "flex items-center gap-3 px-4 py-2.5 text-xs transition-colors",
                     l.active
                        ? "bg-sol-green/10 text-sol-green border-r-2 border-sol-green"
                        : "text-sol-subtle hover:bg-sol-border/20 hover:text-sol-text",
                  ].join(" ")}>
                  <div className={[
                     "w-4 h-4 rounded-full border flex items-center justify-center text-[9px] shrink-0",
                     l.done ? "bg-sol-green/20 border-sol-green/50 text-sol-green" :
                        l.active ? "border-sol-green text-sol-green" :
                           "border-sol-muted text-sol-muted",
                  ].join(" ")}>
                     {l.done ? "✓" : l.active ? "▶" : ""}
                  </div>
                  <span className="leading-tight">{l.title}</span>
               </Link>
            ))}
         </div>
      </aside>
   );
}
