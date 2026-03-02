
import { Twitter, Disc, Github, Mail, ArrowUpRight } from 'lucide-react';
import Image from 'next/image';


const Footer = () => {
   const currentYear = new Date().getFullYear();

   return (
      <footer className="bg-sol-bg text-sol-text dark:bg-foreground dark:text-background border-t border-sol-text/10 dark:border-sol-bg/10 pt-20 pb-10 px-6">
         <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">

               {/* Brand Column */}
               <div className="md:col-span-1">
                  <div className="flex items-center gap-2 mb-6">
                     <div className="w-8 h-8 bg-sol-green rounded-lg flex items-center justify-center text-sol-bg">
                        <span className="font-bold">S</span>
                     </div>
                     <span className="text-xl font-bold tracking-tight">Superteam Academy</span>
                  </div>
                  <p className="text-sm opacity-70 leading-relaxed mb-6">
                     The premier education hub for Solana developers.
                     Learn, Build and Earn.
                  </p>
                  <div className="flex gap-4">
                     <a href="#" className="p-2 bg-sol-text text-sol-bg rounded-full hover:bg-sol-green transition-colors">
                        <Twitter size={18} />
                     </a>
                     <a href="#" className="p-2 bg-sol-text text-sol-bg rounded-full hover:bg-sol-green transition-colors">
                        <Disc size={18} />
                     </a>
                     <a href="#" className="p-2 bg-sol-text text-sol-bg rounded-full hover:bg-sol-green transition-colors">
                        <Github size={18} />
                     </a>
                  </div>
               </div>

               {/* Quick Links */}
               <div>
                  <h4 className="font-bold mb-6 text-sm uppercase tracking-widest">Platform</h4>
                  <ul className="space-y-4 text-sm opacity-80 font-medium">
                     <li><a href="#" className="hover:text-sol-green flex items-center gap-1">All Courses <ArrowUpRight size={14} /></a></li>
                     <li><a href="#" className="hover:text-sol-green">Leaderboard</a></li>
                     <li><a href="#" className="hover:text-sol-green">Bounties</a></li>
                     <li><a href="#" className="hover:text-sol-green">On-chain Proofs</a></li>
                  </ul>
               </div>

               {/* Resources */}
               <div>
                  <h4 className="font-bold mb-6 text-sm uppercase tracking-widest">Resources</h4>
                  <ul className="space-y-4 text-sm opacity-80 font-medium">
                     <li><a href="#" className="hover:text-sol-green">Documentation</a></li>
                     <li><a href="#" className="hover:text-sol-green">Superteam Brazil</a></li>
                     <li><a href="#" className="hover:text-sol-green">Solana University</a></li>
                     <li><a href="#" className="hover:text-sol-green">Support</a></li>
                  </ul>
               </div>

               {/* Newsletter */}
               <div className="md:col-span-1">
                  <h4 className="font-bold mb-6 text-sm uppercase tracking-widest">Stay Updated</h4>
                  <p className="text-sm opacity-70 mb-4">Get the latest developer challenges and ecosystem news.</p>
                  <div className="relative">
                     <input
                        type="email"
                        placeholder="email@example.com"
                        className="w-full bg-transparent border-b-2 border-sol-text dark:border-sol-bg py-2 focus:outline-none focus:border-sol-green transition-colors text-sm"
                     />
                     <button className="absolute right-0 bottom-2 text-sol-green hover:text-sol-text transition-colors">
                        <Mail size={20} />
                     </button>
                  </div>
               </div>
            </div>

            {/* Bottom Bar */}
            <div className="pt-2 flex flex-col md:flex-row gap-6 justify-between items-center">
               <div className="text-xs opacity-80 dark:opacity-50 flex gap-6">
                  <p>© {currentYear} Superteam Academy</p>
                  <a href="#" className="hover:underline">Privacy Policy</a>
                  <a href="#" className="hover:underline">Terms of Service</a>
               </div>
               <div className="flex items-center gap-3 opacity-60hover:grayscale-0 transition-all cursor-pointer">
                  <span className="text-[10px] font-bold uppercase grayscale tracking-tighter">Powered by</span>
                  {/* Simple Solana SVG Logo placeholder */}
                  <div className="flex items-center gap-1">
                     <Image src={"/superteambr-green.svg"} alt='superteambr logo' width={200} height={200} />
                  </div>
               </div>
            </div>
         </div>
      </footer>
   );
};

export default Footer;