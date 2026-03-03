import React, { useState } from 'react'
import Editor from '@monaco-editor/react'
import { Button } from '@/components/ui'

/* ──────────────────────────────────────────────
   Hints Row
────────────────────────────────────────────── */
interface HintsRowProps {
  hints: string[]
}

export const HintsRow: React.FC<HintsRowProps> = ({ hints }) => {
  const [hintsShown, setHintsShown] = useState(0)

  if (hints.length === 0) return null

  return (
    <div className="border-t border-slate-700/50 px-4 py-2.5 bg-[#0e0e18] flex items-center gap-3 flex-shrink-0">
      <button
        onClick={() => setHintsShown(Math.min(hintsShown + 1, hints.length))}
        disabled={hintsShown >= hints.length}
        className="text-xs text-yellow-400 hover:text-yellow-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        💡 {hintsShown < hints.length ? `Show hint (${hintsShown + 1}/${hints.length})` : 'All hints shown'}
      </button>
      {hintsShown > 0 && (
        <span className="text-xs text-yellow-200 bg-yellow-900/20 border border-yellow-800/30 rounded px-3 py-1 font-mono">
          {hints[hintsShown - 1]}
        </span>
      )}
    </div>
  )
}

/* ──────────────────────────────────────────────
   Success Banner (tests passed + claim XP)
────────────────────────────────────────────── */
interface SuccessBannerProps {
  xpReward: number
  xpClaimed: boolean
  isAuthenticated: boolean
  isAwarding: boolean
  xpError: string | null
  solutionCode?: string
  onClaimXP: () => void
}

export const SuccessBanner: React.FC<SuccessBannerProps> = ({
  xpReward,
  xpClaimed,
  isAuthenticated,
  isAwarding,
  xpError,
  solutionCode,
  onClaimXP,
}) => {
  const [showSolution, setShowSolution] = useState(false)

  return (
    <>
      {!xpClaimed && (
        <div className="border-t border-green-500/30 bg-gradient-to-r from-green-900/20 to-cyan-900/20 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="text-sm font-bold text-green-400">All tests passed!</p>
              <p className="text-xs text-gray-400">Earn +{xpReward} XP for this challenge</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {solutionCode && (
              <button
                onClick={() => setShowSolution(!showSolution)}
                className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
              >
                {showSolution ? 'Hide' : 'View'} solution
              </button>
            )}
            {isAuthenticated ? (
              <Button
                onClick={onClaimXP}
                disabled={isAwarding || xpClaimed}
                variant="primary"
                size="sm"
              >
                {isAwarding ? 'Claiming…' : `Claim +${xpReward} XP`}
              </Button>
            ) : (
              <p className="text-xs text-yellow-400">Sign in to claim XP</p>
            )}
          </div>
        </div>
      )}

      {xpClaimed && (
        <div className="border-t border-cyan-500/30 bg-cyan-900/10 px-4 py-2 text-center flex-shrink-0">
          <p className="text-xs text-cyan-400 font-semibold">✅ XP claimed! Keep going → next lesson</p>
        </div>
      )}

      {/* Solution viewer */}
      {showSolution && solutionCode && (
        <div className="border-t border-slate-700/50">
          <div className="px-4 py-2 bg-slate-800/50 text-xs text-gray-400 font-semibold">Solution</div>
          <Editor
            height="200px"
            language="rust"
            value={solutionCode}
            theme="solana-dark"
            options={{ readOnly: true, minimap: { enabled: false }, fontSize: 12, scrollBeyondLastLine: false }}
          />
        </div>
      )}

      {/* XP claim error */}
      {xpError && (
        <div className="border-t border-red-500/30 bg-red-900/10 px-4 py-2 text-xs text-red-400 flex-shrink-0">
          ⚠ {xpError}
        </div>
      )}
    </>
  )
}
