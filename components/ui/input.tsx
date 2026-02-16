import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-12 w-full rounded-2xl border border-white/5 bg-black/60 px-4 py-2 text-base text-white placeholder:text-gray-600 shadow-sm transition-all duration-300 outline-none md:text-sm',
        'focus-visible:border-primary/50 focus-visible:ring-4 focus-visible:ring-primary/10',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
