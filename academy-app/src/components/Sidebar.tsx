import { Dispatch, SetStateAction } from "react";

const NAV = [
   { id: "learn", icon: "🏠", label: "Learn" },
   { id: "practice", icon: "🔥", label: "Practice" },
   { id: "leaderboard", icon: "🏆", label: "Leaderboard" },
   { id: "quests", icon: "🎯", label: "Quests" },
   { id: "profile", icon: "👤", label: "Profile" }
];

export default function Sidebar({ active, setActive }: { active: string, setActive: Dispatch<SetStateAction<string>> }) {
   return (
      <aside className="fixed bg-sol-bg top-0 left-0 w-64 h-screen border-r-2 border-sol-text flex flex-col px-7 py-10 z-100">

         {/* Logo */}
         <div className="flex items-center gap-3 px-2 pb-6 mb-4">
            <span className="text-[20px] font-black text-duo-green tracking-tight">Superteam Academy</span>
         </div>

         {/* Nav items */}
         <nav className="flex flex-col gap-1.5 flex-1">
            {NAV.map(item => (
               <button
                  key={item.id}
                  onClick={() => setActive(item.id)}
                  className={[
                     "flex items-center gap-3.5 px-3.5 py-2 rounded-lg border-2 w-full text-left",
                     "text-sm font-extrabold uppercase tracking-wide transition-all duration-150",
                     active === item.id
                        ? "bg-sol-green/60 text-duo-green-dark border-sol-green"
                        : "bg-transparent text-duo-muted border-transparent hover:bg-duo-surface hover:text-[#3c3c3c] hover:bg-sol-green/50",
                  ].join(" ")}
               >
                  <span className="text-[20px] w-7 text-center shrink-0">{item.icon}</span>
                  <span>{item.label}</span>
               </button>
            ))}
         </nav>

         {/* Footer */}
         <div className="border-t-2 border-duo-border pt-3">
            <button className="flex items-center gap-3.5 px-3.5 py-3 rounded-[14px] border-2 border-transparent w-full text-left text-sm font-extrabold uppercase tracking-wide text-duo-muted hover:bg-duo-surface hover:text-[#3c3c3c] transition-all duration-150">
               <span className="text-[20px] w-7 text-center">⚙️</span>
               <span>Settings</span>
            </button>
         </div>
      </aside>
   )
}