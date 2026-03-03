import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { HintsRow, SuccessBanner } from '../LessonPanels'

describe('HintsRow', () => {
  it('renders nothing when hints array is empty', () => {
    const { container } = render(<HintsRow hints={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders show hint button', () => {
    render(<HintsRow hints={['Hint 1', 'Hint 2']} />)
    expect(screen.getByText(/Show hint \(1\/2\)/)).toBeInTheDocument()
  })

  it('shows first hint when button clicked', () => {
    render(<HintsRow hints={['First hint', 'Second hint']} />)
    const btn = screen.getByText(/Show hint/)
    fireEvent.click(btn)
    expect(screen.getByText('First hint')).toBeInTheDocument()
    expect(screen.getByText(/Show hint \(2\/2\)/)).toBeInTheDocument()
  })

  it('shows all hints after clicking through', () => {
    render(<HintsRow hints={['Hint A', 'Hint B']} />)
    const btn = screen.getByText(/Show hint/)
    fireEvent.click(btn)
    fireEvent.click(screen.getByText(/Show hint/))
    expect(screen.getByText('Hint B')).toBeInTheDocument()
    expect(screen.getByText(/All hints shown/)).toBeInTheDocument()
  })
})

describe('SuccessBanner', () => {
  const baseProps = {
    xpReward: 100,
    xpClaimed: false,
    isAuthenticated: true,
    isAwarding: false,
    xpError: null,
    onClaimXP: vi.fn(),
  }

  it('shows XP reward amount', () => {
    render(<SuccessBanner {...baseProps} />)
    expect(screen.getByText('All tests passed!')).toBeInTheDocument()
    expect(screen.getByText(/Earn \+100 XP/)).toBeInTheDocument()
  })

  it('shows claim button for authenticated users', () => {
    render(<SuccessBanner {...baseProps} />)
    expect(screen.getByText('Claim +100 XP')).toBeInTheDocument()
  })

  it('shows sign-in prompt for unauthenticated users', () => {
    render(<SuccessBanner {...baseProps} isAuthenticated={false} />)
    expect(screen.getByText('Sign in to claim XP')).toBeInTheDocument()
  })

  it('shows claimed message after XP claimed', () => {
    render(<SuccessBanner {...baseProps} xpClaimed={true} />)
    expect(screen.getByText(/XP claimed/)).toBeInTheDocument()
    // The "All tests passed!" banner should not show when claimed
    expect(screen.queryByText('All tests passed!')).not.toBeInTheDocument()
  })

  it('calls onClaimXP when claim button clicked', () => {
    const onClaimXP = vi.fn()
    render(<SuccessBanner {...baseProps} onClaimXP={onClaimXP} />)
    fireEvent.click(screen.getByText('Claim +100 XP'))
    expect(onClaimXP).toHaveBeenCalledOnce()
  })

  it('shows "Claiming…" while awarding', () => {
    render(<SuccessBanner {...baseProps} isAwarding={true} />)
    expect(screen.getByText('Claiming…')).toBeInTheDocument()
  })

  it('shows error message when xpError is set', () => {
    render(<SuccessBanner {...baseProps} xpError="Network error" />)
    expect(screen.getByText(/Network error/)).toBeInTheDocument()
  })

  it('shows solution toggle when solutionCode provided', () => {
    render(<SuccessBanner {...baseProps} solutionCode="let x = 42;" />)
    expect(screen.getByText('View solution')).toBeInTheDocument()
  })
})
