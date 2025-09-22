import * as React from 'react'

import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium outline-none transition-all duration-200 focus-visible:border-ring focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          'hover:bg-primary/90 active:bg-primary/95 bg-primary text-primary-foreground hover:shadow-md active:scale-[0.98]',
        destructive:
          'hover:bg-destructive/90 active:bg-destructive/95 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 bg-destructive text-white hover:shadow-md active:scale-[0.98]',
        outline:
          'active:bg-accent/80 dark:bg-input/30 dark:hover:bg-input/50 shadow-xs border bg-background hover:bg-accent hover:text-accent-foreground hover:shadow-md active:scale-[0.98] dark:border-input',
        secondary:
          'hover:bg-secondary/80 active:bg-secondary/90 bg-secondary text-secondary-foreground hover:shadow-md active:scale-[0.98]',
        ghost:
          'active:bg-accent/80 dark:hover:bg-accent/50 hover:bg-accent hover:text-accent-foreground hover:shadow-sm active:scale-[0.98]',
        link: 'hover:text-primary/80 active:text-primary/90 text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
