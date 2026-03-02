'use client'

import { PropsWithChildren, useState } from "react";
import Sidebar from "~/components/Sidebar";
import TopBar from "~/components/TopBar";


export default function DashboardLayout({
   children
}: PropsWithChildren) {
   const[activeNav, setActiveNav] = useState("learn");

   return (
      <div className="flex min-h-screen font-sans overflow-hidden">
         <Sidebar active={activeNav} setActive={setActiveNav} />
         {/* Offset for fixed sidebar */}
         <div className="ml-64 flex flex-col flex-1 min-h-screen -z-10">
            <TopBar />
            <div className="max-w-5xl w-full mx-auto px-6 pt-7 pb-20">
               {children}
            </div>
         </div>
      </div>
   )
}