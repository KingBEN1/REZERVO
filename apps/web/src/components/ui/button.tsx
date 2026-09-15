import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

const styles = cva('inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition duration-200 active:translate-y-px disabled:pointer-events-none disabled:opacity-50', {
  variants: { variant: { primary: 'bg-gradient-to-br from-teal-600 to-indigo-600 text-white shadow-[0_8px_20px_rgba(15,118,110,.24),inset_0_1px_0_rgba(255,255,255,.25)] hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(79,70,229,.28)]', secondary: 'border border-line bg-white text-ink shadow-sm hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/40', ghost: 'text-ink hover:bg-indigo-50 hover:text-indigo-700', danger: 'bg-gradient-to-br from-red-500 to-rose-700 text-white shadow-lg hover:-translate-y-0.5' }, size: { sm: 'h-9 px-3 text-xs', default: '', lg: 'h-12 px-5' } },
  defaultVariants: { variant: 'primary', size: 'default' },
});
export function Button({ className, variant, size, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof styles>) { return <button className={cn(styles({ variant, size }), className)} {...props} />; }
