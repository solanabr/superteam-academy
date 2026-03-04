"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { ThreeDMarquee } from "@/components/ui/3d-marquee";

const eventImages = [
  { src: "/assets/pictures/image1.png", caption: "Stablecoins are becoming core financial rails and Brazil is part of that conversation." },
  { src: "/assets/pictures/image2.jpg", caption: "Welcome, 2026. New year, new PFP. Yellow is the color of energy and happiness." },
  { src: "/assets/pictures/GVyGdSEWsAA6uZm.jpg", caption: "Solana Copa America Startup Competition" },
  { src: "/assets/pictures/GUPhzpoWMAAflll.jpg", caption: "Build Station in Florianópolis" },
  { src: "/assets/pictures/GI1BzO0WgAAJ59L.jpg", caption: "Supermeet in Brasília" },
  { src: "/assets/pictures/G8EOuHqXMAQNFxK.jpg", caption: "Aleph Hackathon Winners" },
  { src: "/assets/pictures/GWB-ZOzWkAAjyXY.png", caption: "Pitch deck workshops and mentorship" },
  { src: "/assets/pictures/G8juzfhXcAA8BSa.jpg", caption: "Superteam BR Community Events" },
  { src: "/assets/pictures/GMAjSdUXUAAbgTL.jpg", caption: "Hack sessions and networking" },
  { src: "/assets/pictures/GyE8QNpWUAE4Pib.jpg", caption: "Connecting institutions on Solana" },
  { src: "/assets/pictures/GK-lFFxX0AUQupS.jpg", caption: "Building the future of Web3" },
  { src: "/assets/pictures/GyE7nmRXoAARg9w.jpg", caption: "Largest startup competition in LATAM" },
  { src: "/assets/pictures/GyE7rrMXUAA0psB.jpg", caption: "Fostering new founders in the ecosystem" },
  { src: "/assets/pictures/GyE55PrXIAATise.jpg", caption: "Live viewers and participants" },
  { src: "/assets/pictures/GYBpu3db0AQ_6iZ.jpg", caption: "Superteam Brasil Community" },
  { src: "/assets/pictures/HB8hX7TXUAAGIpm.jpg", caption: "Solana developers in Brazil" },
  { src: "/assets/pictures/GVrxGMqW0AEK-zs.jpg", caption: "Ecosystem veterans sharing knowledge" },
  { src: "/assets/pictures/G8EOuHlXAAEWfdI.jpg", caption: "Design thinking training" },
  { src: "/assets/pictures/G2kBaJMW8AAaXCL.jpg", caption: "Pushing the boundaries of dApps" },
  { src: "/assets/pictures/GyE6Ar6WcAEkFpf.jpg", caption: "Solana Hackathon Activities" },
  { src: "/assets/pictures/GMhNSqcXAAA1P3P.jpg", caption: "Supporting builders locally" },
  { src: "/assets/pictures/GT11o4TXwAE9jM3.jpg", caption: "The fastest rails in crypto" },
];

const localeLabels: Record<string, string> = {
  en: "English",
  "pt-BR": "Português",
  es: "Español",
};

export default function LandingPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const [cornerOpen, setCornerOpen] = useState(false);

  return (
    <div className="bg-black min-h-screen text-white relative selection:bg-white selection:text-black overflow-hidden">
      {/* Floating Corner Orb (Login + Language) */}
      <div
        className="fixed top-5 right-5 z-40"
        onMouseEnter={() => setCornerOpen(true)}
        onMouseLeave={() => setCornerOpen(false)}
      >
        <div
          className={`rounded-[20px] border border-white/20 bg-black/55 backdrop-blur-xl transition-all duration-300 ${
            cornerOpen ? "w-[230px] p-3" : "w-12 h-12 p-0"
          }`}
        >
          <button
            className={`flex items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-all ${
              cornerOpen ? "h-9 w-9" : "h-12 w-12 border-none bg-transparent"
            }`}
            onClick={() => setCornerOpen((prev) => !prev)}
            aria-label="Open quick actions"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="2" x2="12" y2="22"></line>
              <path d="M2 12h20"></path>
            </svg>
          </button>

          <div className={`grid gap-2 overflow-hidden transition-all duration-300 ${cornerOpen ? "mt-3 max-h-40 opacity-100" : "max-h-0 opacity-0"}`}>
            <Link
              href="/login"
              className="h-9 rounded-[10px] border border-white/15 bg-white/10 px-3 text-[13px] font-medium text-white/90 transition-colors hover:bg-white hover:text-black flex items-center justify-between"
            >
              <span>Login</span>
              <span aria-hidden="true">→</span>
            </Link>
            <select
              className="h-9 rounded-[10px] border border-white/15 bg-white/10 px-3 text-[13px] text-white/90 outline-none focus:border-white/30"
              value={locale}
              onChange={(event) => router.replace(pathname, { locale: event.target.value })}
            >
              {routing.locales.map((option) => (
                <option key={option} value={option} className="bg-black text-white">
                  {localeLabels[option]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Background Video Layer - Restricted to Hero Section */}
      <div className="absolute inset-0 z-0 h-screen overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-black/40 z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40 z-10" />
        <iframe
          src="https://iframe.mediadelivery.net/embed/609416/613c4d12-209c-42d8-b19c-1998b473557e?autoplay=true&loop=true&muted=true&preload=true&responsive=true&controls=false"
          className="absolute top-1/2 left-1/2 w-[100vw] h-[56.25vw] min-h-[100vh] min-w-[177.77vh] -translate-x-1/2 -translate-y-1/2 border-none opacity-90 scale-[1.02]"
          allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;"
          allowFullScreen
        ></iframe>
      </div>

      {/* Single Immersive Screen */}
      <main className="relative z-10 min-h-screen w-full px-6 md:px-16 pt-16 md:pt-20 pb-20">
        <div className="max-w-[1400px] h-full w-full mx-auto flex items-center">
          <div className="grid w-full items-end gap-10 lg:grid-cols-[1.618fr_1fr]">
            <div>
              <div className="overflow-hidden mb-6">
                <p className="text-[12px] md:text-[14px] uppercase tracking-[0.4em] text-white/60 font-medium animate-reveal-up" style={{ animationDelay: "200ms" }}>
                  The Premium Solana Experience
                </p>
              </div>
              <div className="overflow-hidden mb-6 md:mb-8">
                <h1 className="text-[44px] sm:text-[56px] md:text-[92px] lg:text-[128px] leading-[1] md:leading-[0.94] font-bold tracking-[-0.03em] text-white animate-reveal-up" style={{ animationDelay: "400ms" }}>
                  BUILD <br className="hidden md:block" /> THE FUTURE.
                </h1>
              </div>
            </div>

            <div className="animate-fade-in lg:pb-6" style={{ animationDelay: "1000ms" }}>
              <p className="text-[16px] md:text-[18px] text-white/60 font-medium max-w-[420px] leading-relaxed">
                Master Solana development through real-world dApp construction and on-chain verifiable credentials.
              </p>
              <div className="mt-7">
                <Link href="/courses" className="w-full sm:w-auto">
                  <Button
                    variant="default"
                    size="lg"
                    className="rounded-full w-full sm:w-auto px-10 h-14 text-[14px] uppercase tracking-[0.1em] font-bold bg-white text-black hover:bg-white/90 hover:scale-105 transition-all duration-500"
                  >
                    Explore Curriculum
                  </Button>
                </Link>
              </div>
              <div className="mt-7 grid grid-cols-2 gap-4 max-w-[360px]">
                <div className="rounded-[14px] border border-white/15 bg-black/25 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">Tracks</p>
                  <p className="mt-1 text-[20px] font-semibold text-white">3</p>
                </div>
                <div className="rounded-[14px] border border-white/15 bg-black/25 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">Credentials</p>
                  <p className="mt-1 text-[20px] font-semibold text-white">On-chain</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Marquee Section */}
      <div className="relative z-10 w-full bg-black pt-20 md:pt-32 pb-20 md:pb-32">
        <div className="max-w-[1400px] mx-auto px-6 md:px-16 text-center mb-10 md:mb-16">
          <h2 className="text-[32px] md:text-[64px] font-bold tracking-tight text-white mb-4 md:mb-6 animate-reveal-up">
            Join the movement.
          </h2>
          <p className="text-[16px] md:text-[22px] text-white/50 max-w-[700px] mx-auto leading-relaxed animate-fade-in">
            Superteam Brasil events, hackathons, and moments. Built by the community, for the community. Follow <a href="https://x.com/SuperteamBR" target="_blank" rel="noopener noreferrer" className="text-white hover:underline transition-colors">@SuperteamBR</a> to build with us.
          </p>
        </div>
        <ThreeDMarquee images={eventImages} />
      </div>

      <style jsx global>{`
        @keyframes revealUp {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-reveal-up {
          animation: revealUp 1.2s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .animate-fade-in {
          animation: fadeIn 1.5s ease-out both;
        }
      `}</style>
    </div>
  );
}
