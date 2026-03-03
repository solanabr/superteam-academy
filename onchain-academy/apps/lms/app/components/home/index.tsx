'use client'

import dynamic from 'next/dynamic'
import { Navbar } from '../../../components/layout/Nav'
import { Hero } from './Hero'
import './landing-a.css'

const SocialProofBar = dynamic(
  () => import('./SocialProofBar').then((m) => ({ default: m.SocialProofBar })),
  { ssr: true },
)
const LearningPaths = dynamic(
  () => import('./LearningPaths').then((m) => ({ default: m.LearningPaths })),
  { ssr: true },
)
const Features = dynamic(
  () => import('./Features').then((m) => ({ default: m.Features })),
  { ssr: true },
)
const Testimonials = dynamic(
  () => import('./Testimonials').then((m) => ({ default: m.Testimonials })),
  { ssr: true },
)
const CtaBanner = dynamic(
  () => import('./CtaBanner').then((m) => ({ default: m.CtaBanner })),
  { ssr: true },
)
const Footer = dynamic(
  () =>
    import('../../../components/layout/Footer').then((m) => ({
      default: m.Footer,
    })),
  { ssr: true },
)

export function LandingA() {
  return (
    <div className='min-h-screen bg-cream text-charcoal overflow-x-hidden font-[var(--font-dm-sans),sans-serif] text-base'>
      <Navbar />
      <Hero />
      <SocialProofBar />
      <LearningPaths />
      <div className='landing-section-divider max-w-[1200px] mx-auto px-4 sm:px-0' />
      <Features />
      <Testimonials />
      <CtaBanner />
      <Footer />
    </div>
  )
}
