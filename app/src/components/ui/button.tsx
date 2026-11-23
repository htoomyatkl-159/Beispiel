// Accessible fallback, not a generated shadcn component; see design-status.json.
import { Button as Primitive } from '@base-ui/react/button';
import type { ComponentProps } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';

const variants = cva('ui-button', {
  variants: { variant: { default: 'button-primary', outline: 'button-outline', ghost: 'button-ghost' } },
  defaultVariants: { variant: 'default' },
});
export function Button({ className, variant, ...props }: ComponentProps<typeof Primitive> & VariantProps<typeof variants>) {
  return <Primitive className={clsx(variants({ variant }), className)} {...props} />;
}
