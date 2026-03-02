'use client'

import { motion } from 'framer-motion';
import { Play, BookOpen, Code, Trophy, Star, ChevronRight } from 'lucide-react';
import ConnectWallet from './WalletConnect';
import { Button } from './ui/button';
import Link from 'next/link';

const LandingPageMain = () => {
   const learningPath = [
      { title: "Solana 101", icon: <BookOpen />, status: "completed", xp: 100 },
      { title: "Rust Fundamentals", icon: <Code />, status: "current", xp: 250 },
      { title: "Anchor Framework", icon: <Star />, status: "locked", xp: 400 },
      { title: "Building a dApp", icon: <Play />, status: "locked", xp: 600 },
      { title: "Graduation", icon: <Trophy />, status: "locked", xp: 1000 },
   ];

   return (
      <main className="flex flex-col w-full max-w-8xl md:max-w-6xl items-center ">
         {/* --- HERO SECTION --- */}
         <section className="relative pb-32 px-6 overflow-hidden w-full">
            <div className="max-w-6xl mx-auto text-center relative z-10 flex items-center justify-center pt-32">
               <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
               >
                  <div>
                     <h1 className="text-5xl md:text-5xl font-extrabold leading-tight mb-4 text-sol-forest dark:text-sol-yellow">
                        Learn. Build. Earn<br />
                        {/* <span className="text-sol-green italic">Earn your Place.</span> */}
                     </h1>
                     <p className="max-w-2xl mx-auto text-md md:text-xl opacity-50 mb-10">
                        The premium, gamified path for developers. Go from zero to deploying
                        production-ready dApps while earning on-chain credentials.
                     </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                     <ConnectWallet title='Get Started' />
                     <Button
                        variant={"outline"}
                        className="
                        border-sol-green hover:bg-sol-yellow border text-sol-text font-extrabold uppercase tracking-wide
                        text-md w-64 rounded-lg px-8 py-6 shadow-sol-green shadow-md active:shadow-none dark:bg-sol-bg dark:hover:bg-sol-yellow dark:text-sol-text
                        hover:shadow-sol-green hover:translate-y-0.5
                        active:translate-y-1 transition-all duration-100
                     ">
                        <Link href={"/es/courses"}>Browse Courses</Link>
                     </Button>
                  </div>
               </motion.div>
            </div>

            {/* Subtle Background Glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-100 bg-sol-yellow/20 blur-[120px] rounded-full z-0" />
         </section>
         {/* <div>
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-7xl">
            {t("welcomeMessage")}
          </h1>
          <p className="mt-5 text-2xl text-gray-500 dark:text-gray-400">
            {t("description")}
          </p>
        </div>
        <div>
          <ConnectButton title="Get Started" />
        </div> */}
         {/* --- LEARNING PATH SECTION --- */}
         {/* <section className="py-24 px-6 bg-sol-text text-sol-bg">
            <div className="max-w-4xl mx-auto">
               <div className="text-center mb-16">
                  <h2 className="text-4xl font-bold mb-4">Your Developer Journey</h2>
                  <p className="text-sol-bg/60">Follow the path, gain XP, and unlock real-world opportunities.</p>
               </div>

               <div className="relative flex flex-col items-center">
                  The Winding Line
                  <div className="absolute top-0 bottom-0 w-1 bg-sol-bg/20 left-1/2 -translate-x-1/2 hidden md:block" />

                  {learningPath.map((node, index) => (
                     <motion.div
                        key={index}
                        initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className={`relative flex items-center w-full mb-16 ${index % 2 === 0 ? 'md:flex-row-reverse' : 'md:flex-row'}`}
                     >
                        Node Content
                        <div className="w-full md:w-1/2 flex justify-center px-4">
                           <div className={`p-6 rounded-2xl border-2 w-full max-w-sm transition-all duration-500 
                    ${node.status === 'completed' ? 'border-sol-green bg-sol-green/10' :
                                 node.status === 'current' ? 'border-sol-yellow bg-sol-yellow/10 shadow-[0_0_20px_rgba(255,210,63,0.3)]' :
                                    'border-sol-bg/10 opacity-40'}`}
                           >
                              <div className="flex items-center gap-4 mb-3">
                                 <div className={`p-3 rounded-lg ${node.status === 'current' ? 'bg-sol-yellow text-sol-text' : 'bg-sol-bg/10'}`}>
                                    {node.icon}
                                 </div>
                                 <div>
                                    <h3 className="font-bold text-xl">{node.title}</h3>
                                    <span className="text-sm font-medium text-sol-yellow">{node.xp} XP Available</span>
                                 </div>
                              </div>
                              {node.status === 'current' && (
                                 <button className="w-full mt-4 bg-sol-bg text-sol-text py-2 rounded-lg font-bold hover:bg-sol-yellow transition-colors">
                                    Continue
                                 </button>
                              )}
                           </div>
                        </div>

                        Central Circle Marker
                        <div className="absolute left-1/2 -translate-x-1/2 w-10 h-10 rounded-full border-4 border-sol-text bg-sol-bg z-20 hidden md:flex items-center justify-center">
                           <div className={`w-3 h-3 rounded-full ${node.status === 'completed' ? 'bg-sol-green' : node.status === 'current' ? 'bg-sol-yellow animate-pulse' : 'bg-sol-bg/20'}`} />
                        </div>

                        Empty spacer for grid alignment
                        <div className="hidden md:block w-1/2" />
                     </motion.div>
                  ))}
               </div>
            </div>
         </section> */}
      </main>
   );
};

export default LandingPageMain;