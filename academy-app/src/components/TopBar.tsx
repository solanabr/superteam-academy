"use client";

import ConnectWallet from "./WalletConnect";

const STATS = [
   { icon: "🔥", val: "47", bg: "bg-orange-50", border: "border-orange-200" },
   { icon: "⚡", val: "1,240", bg: "bg-orange-50", border: "border-academy-primary/50" },
];

export default function TopBar() {
   return (
      <header className="sticky top-0 z-40">
         <div className="flex items-baseline-last justify-end-safe px-6 h-24 max-w-265 mx-auto w-full">
            {/* Stats row */}
            <div className="flex items-center gap-2 mt-12">
               {/* Streak / XP / Gems pills */}
               {STATS.map((s, i) => (
                  <div key={i}
                     className={`flex items-center gap-1.5 px-3 py-1 rounded-full border-2 font-extrabold cursor-pointer
                          transition-transform duration-150 hover:-translate-y-0.5
                          ${s.bg} ${s.border}`}>
                     <span className="text-[17px]">{s.icon}</span>
                     <span className="text-sm tracking-tight">{s.val}</span>
                  </div>
               ))}

               {/* Avatar */}
               <div className="rounded-full  border-2 border-duo-green flex items-center text-xl cursor-pointer hover:scale-110 transition-transform duration-150">
                  <ConnectWallet />
               </div>
            </div>
         </div>
      </header>
   );
}