import { cn } from '@/libs/utils'
import { Footer } from './Footer'
import { Navbar } from './Nav'

interface StandardLayoutProps {
  children: React.ReactNode | React.ReactNode[]
  className?: string
}

export const StandardLayout = ({
  children,
  className,
}: StandardLayoutProps) => {
  return (
    <div className={cn('min-h-screen bg-background', className)}>
      <Navbar />

      <div className='pt-[68px]'>{children}</div>

      <Footer />
    </div>
  )
}
