import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

const styles = cva('inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition active:translate-y-px disabled:pointer-events-none disabled:opacity-50', {
  variants: { variant: { primary: 'bg-forest text-white hover:bg-green-900', secondary: 'bg-white text-ink border border-line hover:bg-sand', ghost: 'text-ink hover:bg-forest/10', danger: 'bg-red-600 text-white hover:bg-red-700' }, size: { sm: 'h-9 px-3 text-xs', default: '', lg: 'h-12 px-5' } },
  defaultVariants: { variant: 'primary', size: 'default' },
});
export function Button({ className, variant, size, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof styles>) { return <button className={cn(styles({ variant, size }), className)} {...props} />; }
