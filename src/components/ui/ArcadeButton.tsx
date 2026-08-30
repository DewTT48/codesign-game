import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'
import { Link } from 'react-router-dom'

type ArcadeButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    to?: string
    variant?: 'primary' | 'secondary' | 'ghost'
  }
>

export function ArcadeButton({
  children,
  to,
  variant = 'primary',
  className = '',
  ...buttonProps
}: ArcadeButtonProps) {
  const classes = `arcade-button arcade-button--${variant} ${className}`.trim()

  if (to) {
    return (
      <Link className={classes} to={to}>
        {children}
      </Link>
    )
  }

  return (
    <button className={classes} {...buttonProps}>
      {children}
    </button>
  )
}
