'use client'

import { Github, MessageCircle, Share2, Youtube } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Link } from '../../i18n/navigation'

const FOOTER_LINK_KEYS = ['Learn', 'Community', 'Company', 'Support'] as const

const socialLinks = [
  { label: 'X', icon: Share2, href: 'https://x.com/superteam' },
  {
    label: 'Discord',
    icon: MessageCircle,
    href: 'https://discord.gg/superteam',
  },
  { label: 'GitHub', icon: Github, href: 'https://github.com/superteam' },
  { label: 'YouTube', icon: Youtube, href: 'https://youtube.com/@superteam' },
]

export const Footer = () => {
  const t = useTranslations('home')
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  return (
    <footer className='bg-charcoal py-12 sm:py-16 md:py-20 px-4 sm:px-[5%] pb-8'>
      <div className='max-w-[1200px] mx-auto'>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.8fr_1fr_1fr_1fr_1fr] gap-8 sm:gap-10 mb-10 sm:mb-14'>
          <div>
            <div className='font-display text-xl sm:text-[22px] text-[var(--cream)] mb-3.5'>
              Superteam <span className='text-[var(--accent)]'>Academy</span>
            </div>
            <p className='text-xs sm:text-[13px] text-[rgba(247,234,203,0.5)] leading-[1.7] mb-6 font-[inherit]'>
              {t('footer.tagline')}
            </p>
            <div className='mb-6'>
              <div className='text-xs font-semibold text-[rgba(247,234,203,0.6)] mb-2.5 uppercase tracking-[0.06em] font-[inherit]'>
                {t('footer.newsletterLabel')}
              </div>
              {!subscribed ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (email) {
                      setSubscribed(true)
                    }
                  }}
                  className='flex flex-col sm:flex-row gap-2 sm:gap-0'
                >
                  <label htmlFor='footer-newsletter-email' className='sr-only'>
                    {t('footer.newsletterLabel')}
                  </label>
                  <input
                    id='footer-newsletter-email'
                    type='email'
                    placeholder={t('footer.newsletterPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete='email'
                    aria-label={t('footer.newsletterPlaceholder')}
                    className='flex-1 py-2.5 px-3.5 rounded-t-[7px] sm:rounded-l-[7px] sm:rounded-tr-none sm:rounded-br-none bg-[rgba(247,234,203,0.07)] border border-[rgba(247,234,203,0.15)] sm:border-r-0 text-[var(--cream)] text-[13px] outline-none font-[inherit] min-w-0'
                  />
                  <button
                    type='submit'
                    className='bg-[var(--primary)] text-[var(--cream)] py-2.5 px-4 rounded-b-[7px] sm:rounded-r-[7px] sm:rounded-tl-none sm:rounded-bl-none border-none text-[13px] font-semibold cursor-pointer font-[inherit] whitespace-nowrap'
                  >
                    {t('footer.newsletterBtn')}
                  </button>
                </form>
              ) : (
                <div className='text-[#52dda0] text-[13px] font-semibold font-[inherit]'>
                  {t('footer.subscribedMsg')}
                </div>
              )}
            </div>
            <div className='flex gap-2.5'>
              {socialLinks.map((s) => {
                const Icon = s.icon
                return (
                  <a
                    key={s.label}
                    href={s.href}
                    target='_blank'
                    rel='noopener noreferrer'
                    title={s.label}
                    className='w-9 h-9 rounded-lg bg-[rgba(247,234,203,0.07)] border border-[rgba(247,234,203,0.12)] flex items-center justify-center text-[rgba(247,234,203,0.45)] transition-all shrink-0 hover:bg-[rgba(247,234,203,0.13)] hover:text-[var(--cream)] hover:border-[rgba(247,234,203,0.25)]'
                    aria-label={s.label}
                  >
                    <Icon size={16} strokeWidth={2} />
                  </a>
                )
              })}
            </div>
          </div>
          {FOOTER_LINK_KEYS.map((key) => {
            const heading = t(`footer.linkHeadings.${key}`)
            const links = t.raw(`footer.links.${key}`) as string[]
            return (
              <div key={key}>
                <div className='text-xs font-bold uppercase tracking-[0.08em] text-[rgba(247,234,203,0.35)] mb-4 font-[inherit]'>
                  {heading}
                </div>
                <ul className='list-none flex flex-col gap-2.5'>
                  {links.map((l) => (
                    <li key={l}>
                      <Link
                        href='/'
                        className='text-[13px] text-[rgba(247,234,203,0.55)] no-underline transition-colors font-[inherit] hover:text-[var(--cream)]'
                      >
                        {l}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
        <div className='pt-6 border-t border-[rgba(247,234,203,0.08)] flex justify-between items-center flex-wrap gap-3'>
          <span className='text-xs text-[rgba(247,234,203,0.3)] font-[inherit]'>
            {t('footer.copyright')}
          </span>
          <div className='flex gap-2 items-center'>
            <div className='landing-animate-pulse-dot w-2 h-2 rounded-full bg-[#52dda0]' />
            <span className='text-xs text-[#52dda0] font-[inherit] font-medium'>
              {t('footer.status')}
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
