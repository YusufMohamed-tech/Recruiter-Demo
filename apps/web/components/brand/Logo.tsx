import Image from 'next/image'
import { cn } from '@/lib/utils/cn'

interface LogoProps {
  variant?: 'full' | 'icon'
  className?: string
}

export function Logo({ variant = 'full', className }: LogoProps) {
  return (
    <Image
      src="https://chessboard-group.com/wp-content/uploads/2025/04/cropped-chess-board-logo.avif"
      alt="Chessboard Group"
      width={variant === 'full' ? 180 : 40}
      height={variant === 'full' ? 49 : 40}
      className={cn('object-contain', className)}
      priority
    />
  )
}
