import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-300 active:scale-95 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(0,255,0,0.3)] hover:shadow-[0_0_25px_rgba(0,255,0,0.5)] hover:bg-primary/90 hover:-translate-y-0.5',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 shadow-[0_0_15px_rgba(255,0,0,0.2)]',
        outline:
          'border border-primary/30 bg-background text-primary hover:bg-primary/10 hover:border-primary/60 shadow-sm transition-all duration-300',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-primary/10',
        ghost:
          'text-primary/70 hover:text-primary hover:bg-primary/10 transition-colors',
        link: 'text-primary underline-offset-4 hover:underline decoration-primary/50',
      },
      size: {
        default: 'h-9 px-4 py-2 md:h-11 md:px-6 md:py-2.5',
        sm: 'h-8 px-3 rounded-lg gap-1.5 md:h-9 md:px-4',
        lg: 'h-11 px-6 md:h-14 md:rounded-2xl md:px-8 text-sm md:text-base',
        icon: 'size-9 md:size-11',
        'icon-sm': 'size-8 md:size-9',
        'icon-lg': 'size-11 md:size-14',
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
