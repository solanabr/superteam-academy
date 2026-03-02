import { PropsWithChildren } from "react";

import Header from "~/components/Header";

export default function CourseLayout({ children }: PropsWithChildren) {

   return (
      <div className="flex flex-col items-center justify-center font-sans  bg-sol-bg ">
         <Header />
         <div className="w-full max-w-8xl md:max-w-6xl min-h-screen bg-sol-bg font-display">
            {children}
         </div>
      </div>
   )
}