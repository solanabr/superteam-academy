'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { useQuery } from '@tanstack/react-query'
import { Connection, PublicKey } from '@solana/web3.js'
import { OnchainCourseService } from '@/lib/services/onchain-course.service'
import { XpService } from '@/lib/services/xp.service'
import { CredentialService } from '@/lib/services/credential.service'
import { StatsCard, LevelDisplay, ProgressBar } from './GamificationUI'
import { Loading } from '@/components/ui/Loading'
import React from 'react'

interface DashboardStats {
  level: number
  totalXp: number
  enrolledCourses: number
  completedCourses: number
  credentials: number
}

/**
 * On-Chain Dashboard Component
 * Displays learner progress, XP, credentials fetched from Anchor program
 */
export function OnChainDashboard() {
  const { publicKey } = useWallet()

  // Initialize on-chain services
  const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com'
  const connection = new Connection(rpcUrl, 'confirmed')
  const courseService = new OnchainCourseService(connection)
  const xpService = new XpService(connection)
  const heliusRpc = process.env.NEXT_PUBLIC_HELIUS_RPC_URL || rpcUrl
  const credentialService = new CredentialService(heliusRpc)

  // Query: User's enrollments
  const { data: enrollments = [], isLoading: enrollmentsLoading } = useQuery({
    queryKey: ['onchain-enrollments', publicKey?.toString()],
    queryFn: async () => {
      if (!publicKey) return []
      try {
        return await courseService.getLearnerEnrollments(publicKey)
      } catch (error) {
        console.error('Failed to fetch enrollments:', error)
        return []
      }
    },
    enabled: !!publicKey,
    staleTime: 30000,
  })

  // Query: Completed courses
  const { data: completedCourses = [], isLoading: completedLoading } = useQuery({
    queryKey: ['onchain-completed-courses', publicKey?.toString()],
    queryFn: async () => {
      if (!publicKey) return []
      try {
        return await courseService.getCompletedCourses(publicKey)
      } catch (error) {
        console.error('Failed to fetch completed courses:', error)
        return []
      }
    },
    enabled: !!publicKey,
    staleTime: 30000,
  })

  // Query: XP Balance
  const { data: xpBalance = 0, isLoading: xpLoading } = useQuery({
    queryKey: ['onchain-xp-balance', publicKey?.toString()],
    queryFn: async () => {
      if (!publicKey) return 0
      try {
        // Get XP mint from config (would need to fetch from config PDA)
        // For now, use environment variable if available
        const xpMintStr = process.env.NEXT_PUBLIC_XP_MINT_ADDRESS
        if (!xpMintStr) {
          console.warn('XP_MINT_ADDRESS not configured')
          return 0
        }
        const xpMint = new PublicKey(xpMintStr)
        return await xpService.getXpBalance(publicKey, xpMint)
      } catch (error) {
        console.error('Failed to fetch XP balance:', error)
        return 0
      }
    },
    enabled: !!publicKey,
    staleTime: 30000,
  })

  // Query: Credentials  
  const { data: credentials = [], isLoading: credentialsLoading } = useQuery({
    queryKey: ['onchain-credentials', publicKey?.toString()],
    queryFn: async () => {
      if (!publicKey) return []
      try {
        return await credentialService.getCredentials(publicKey)
      } catch (error) {
        console.error('Failed to fetch credentials:', error)
        return []
      }
    },
    enabled: !!publicKey,
    staleTime: 60000,
  })

  const isLoading = enrollmentsLoading || completedLoading || xpLoading || credentialsLoading

  if (!publicKey) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-gray-600 dark:text-gray-400">Connect your wallet to view dashboard</p>
      </div>
    )
  }

  if (isLoading) {
    return <Loading />
  }

  const level = XpService.calculateLevel(xpBalance)
  const xpForNextLevel = Math.ceil(((level + 1) ** 2) * 100)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Connected: {publicKey.toString().slice(0, 8)}...
        </p>
      </div>

      {/* XP & Level Section */}
      <div className="bg-white dark:bg-terminal-surface border border-gray-300 dark:border-terminal-border rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">XP & Level</h2>
        <LevelDisplay level={level} xp={xpBalance} xpRequiredForNextLevel={xpForNextLevel} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard icon="📚" label="Enrolled Courses" value={enrollments.length} />
        <StatsCard icon="✅" label="Completed Courses" value={completedCourses.length} />
        <StatsCard icon="🏆" label="Credentials" value={credentials.length} />
        <StatsCard icon="⭐" label="Current Level" value={level} />
      </div>

      {/* Enrolled Courses Section */}
      {enrollments.length > 0 && (
        <div className="bg-white dark:bg-terminal-surface border border-gray-300 dark:border-terminal-border rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Enrolled Courses</h2>
          <div className="space-y-4">
            {enrollments.map(enrollment => (
              <div key={enrollment.courseId} className="border border-gray-200 dark:border-terminal-border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Course {enrollment.courseId.slice(0, 8)}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Enrolled: {new Date(enrollment.enrolledAt * 1000).toLocaleDateString()}
                </p>
                <ProgressBar value={enrollment.progress} showLabel />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Credentials Section */}
      {credentials.length > 0 && (
        <div className="bg-white dark:bg-terminal-surface border border-gray-300 dark:border-terminal-border rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Credentials</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {credentials.map(cred => (
              <div key={cred.assetId} className="border border-green-300 dark:border-neon-green rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
                <h3 className="font-semibold text-green-900 dark:text-neon-green mb-1">{cred.name}</h3>
                <p className="text-sm text-green-700 dark:text-green-300 mb-2">Track: {cred.trackId}</p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  Level {cred.level} • {cred.coursesCompleted} courses • {cred.totalXp} XP
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {enrollments.length === 0 && credentials.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">No courses enrolled yet</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Enroll in courses to start earning XP and credentials
          </p>
        </div>
      )}
    </div>
  )
}
