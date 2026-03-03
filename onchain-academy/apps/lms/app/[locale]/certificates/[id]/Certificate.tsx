'use client'

import { StandardLayout } from '@/components/layout/StandardLayout'
import {
  MOCK_CERTIFICATE,
  SHARE_OPTIONS,
} from '@/libs/constants/certificate.constants'
import { truncateAddress } from '@/libs/string'
import { motion } from 'framer-motion'
import { Award, CheckCircle2, Download, ExternalLink } from 'lucide-react'

// ─── Helpers ────────────────────────────────────────────────────

function DetailRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className='flex items-center justify-between py-3 border-b border-border-warm last:border-0'>
      <span className='font-ui text-[0.75rem] text-text-tertiary'>{label}</span>
      <span className='font-ui text-[0.8rem] font-semibold text-charcoal flex items-center gap-1.5'>
        {value}
      </span>
    </div>
  )
}

// ─── Certificate Page ──────────────────────────────────────────

interface IProps {
  certificateId: string
}

const Certificate = ({ certificateId }: IProps) => {
  // In a real app, fetch cert data by ID here
  const cert = MOCK_CERTIFICATE

  return (
    <StandardLayout>
      <div className='bg-green-secondary min-h-[calc(100vh-80px)]'>
        <div className='max-w-[1200px] mx-auto px-[5%] py-8 lg:py-16'>
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12'>
            {/* LEFT: Visual Certificate (8 cols) */}
            <div className='lg:col-span-8 flex flex-col gap-6'>
              {/* Certificate Canvas Area */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className='relative w-full min-h-[500px] sm:min-h-[600px] rounded-2xl overflow-hidden shadow-2xl bg-cream border-8 flex flex-col'
                style={{ borderColor: 'hsl(var(--card-warm))' }}
              >
                {/* Visual Certificate Design */}
                <div className='absolute inset-0 pattern-paper opacity-50' />
                <div className='absolute inset-0 bg-linear-to-br from-green-mint/5 to-transparent' />

                {/* Decorative borders */}
                <div className='absolute m-4 md:m-8 inset-0 border border-green-primary/20 pointer-events-none' />
                <div className='absolute m-5 md:m-9 inset-0 border-2 border-green-primary/10 pointer-events-none' />

                {/* Top Ribbons */}
                <div className='absolute top-0 right-12 w-16 h-24 bg-green-primary/10 rounded-b-full blur-xl' />
                <div className='absolute top-0 left-12 w-24 h-32 bg-amber/10 rounded-b-full blur-xl' />

                <div className='relative flex-1 flex flex-col items-center justify-center p-8 md:p-16 text-center z-10'>
                  <Award
                    size={48}
                    strokeWidth={1}
                    className='text-green-primary mb-4'
                  />

                  <span className='font-ui text-[0.75rem] tracking-[0.2em] uppercase text-text-tertiary mb-2'>
                    Superteam Academy
                  </span>

                  <h1 className='font-display text-2xl md:text-4xl lg:text-5xl font-black text-charcoal mb-6'>
                    Certificate of Completion
                  </h1>

                  <p className='font-ui text-sm text-text-secondary mb-2'>
                    This certifies that
                  </p>

                  <h2 className='font-display text-3xl md:text-4xl text-green-primary font-bold mb-6 italic'>
                    {cert.recipientName}
                  </h2>

                  <p className='font-ui text-sm text-text-secondary mb-4 max-w-lg'>
                    has successfully completed the comprehensive curriculum and
                    demonstrated mastery in
                  </p>

                  <h3 className='font-display text-xl md:text-2xl font-bold text-charcoal mb-8 md:mb-12'>
                    {cert.courseName}
                  </h3>

                  {/* Footer details */}
                  <div className='w-full flex justify-between items-end mt-auto px-4 md:px-12 pt-8'>
                    <div className='text-left'>
                      <div className='font-ui text-[0.7rem] uppercase tracking-wider text-text-tertiary mb-1'>
                        Date Issued
                      </div>
                      <div className='font-ui text-sm font-semibold text-charcoal'>
                        {cert.issueDate}
                      </div>
                    </div>

                    <div className='text-center'>
                      <div className='w-24 md:w-32 h-px bg-border-warm mb-2 mx-auto' />
                      <div className='font-ui text-[0.7rem] uppercase tracking-wider text-text-tertiary'>
                        Lead Instructor
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Download Action */}
              <div className='flex justify-center mt-2'>
                <button className='flex items-center gap-2 px-8 py-3 rounded-xl bg-cream text-charcoal font-display font-bold hover:bg-cream/90 transition-all hover:scale-105 hover:shadow-lg border border-border-warm shadow-md group'>
                  <Download
                    size={18}
                    strokeWidth={2}
                    className='text-green-primary group-hover:-translate-y-0.5 transition-transform'
                  />
                  <span className='group-hover:text-green-primary transition-colors'>
                    Download as Image
                  </span>
                </button>
              </div>
            </div>

            {/* RIGHT: NFT Details (4 cols) */}
            <div className='lg:col-span-4 flex flex-col gap-6'>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className='p-6 rounded-2xl border'
                style={{
                  background: 'hsl(var(--card-warm))',
                  borderColor: 'hsl(var(--border-warm))',
                }}
              >
                <div className='flex items-center gap-2 mb-6'>
                  <CheckCircle2 size={18} className='text-green-primary' />
                  <h3 className='font-display text-[1.1rem] font-bold text-charcoal'>
                    Verified Credential
                  </h3>
                </div>

                <div className='flex flex-col mb-6'>
                  <DetailRow label='Recipient' value={cert.recipientName} />
                  <DetailRow
                    label='Wallet Address'
                    value={
                      <span className='font-mono'>
                        {truncateAddress(cert.ownerAddress)}
                      </span>
                    }
                  />
                  <DetailRow label='Course' value={cert.courseName} />
                  <DetailRow
                    label='Earned XP'
                    value={
                      <span className='text-amber'>
                        {cert.xpEarned.toLocaleString()} XP
                      </span>
                    }
                  />
                  <DetailRow label='Issue Date' value={cert.issueDate} />
                </div>

                {/* Skills array */}
                <div className='mb-8'>
                  <span className='font-ui text-[0.75rem] text-text-tertiary block mb-3'>
                    Skills Certified
                  </span>
                  <div className='flex flex-wrap gap-2'>
                    {cert.skills.map((skill) => (
                      <span
                        key={skill}
                        className='px-3 py-1 rounded-lg text-[0.65rem] font-ui font-semibold bg-green-primary/10 text-green-primary border border-green-primary/20'
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* On-chain Details */}
                <div className='flex flex-col gap-3'>
                  <h4 className='font-display text-[0.85rem] font-bold text-charcoal mb-1'>
                    On-Chain Record
                  </h4>

                  <a
                    href={`https://explorer.solana.com/address/${cert.mintAddress}?cluster=devnet`}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex items-center justify-between p-3 rounded-xl bg-cream border border-border-warm hover:border-green-primary transition-colors group'
                  >
                    <div className='flex flex-col'>
                      <span className='font-ui text-[0.65rem] text-text-tertiary'>
                        NFT Mint Address
                      </span>
                      <span className='font-mono text-[0.75rem] text-charcoal font-semibold'>
                        {truncateAddress(cert.mintAddress, 6, 6)}
                      </span>
                    </div>
                    <ExternalLink
                      size={14}
                      className='text-text-tertiary group-hover:text-green-primary'
                    />
                  </a>

                  <a
                    href={cert.metadataUri}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex items-center justify-between p-3 rounded-xl bg-cream border border-border-warm hover:border-green-primary transition-colors group'
                  >
                    <div className='flex flex-col'>
                      <span className='font-ui text-[0.65rem] text-text-tertiary'>
                        Metadata URI
                      </span>
                      <span className='font-mono text-[0.75rem] text-charcoal font-semibold'>
                        arweave.net/...
                      </span>
                    </div>
                    <ExternalLink
                      size={14}
                      className='text-text-tertiary group-hover:text-green-primary'
                    />
                  </a>
                </div>
              </motion.div>

              {/* Share Options */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className='grid grid-cols-3 gap-2'
              >
                {SHARE_OPTIONS.map((action) => {
                  const Icon = action.icon
                  return (
                    <button
                      key={action.id}
                      className='flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border bg-card-warm border-border-warm hover:border-green-primary hover:bg-green-primary/5 transition-all group'
                    >
                      <Icon
                        size={18}
                        strokeWidth={1.5}
                        className='text-text-tertiary group-hover:text-green-primary transition-colors'
                      />
                      <span className='font-ui text-[0.65rem] font-semibold text-text-secondary group-hover:text-green-primary'>
                        {action.name}
                      </span>
                    </button>
                  )
                })}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </StandardLayout>
  )
}

export default Certificate
