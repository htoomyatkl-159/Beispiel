import type { SVGProps } from 'react';

/** Original Beispiel monogram: connected B paths and a discovery spark. */
export function BeispielMark(props: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" {...props}>
    <path d="M11 8v32M11 8h13a8 8 0 0 1 0 16H11m0 0h16a8 8 0 0 1 0 16H11" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="m38 4 2.2 4.8L45 11l-4.8 2.2L38 18l-2.2-4.8L31 11l4.8-2.2L38 4Z" fill="currentColor" />
  </svg>;
}

/** Decorative discovery constellation, not artwork or measured audio features. */
export function DiscoveryGlyph({ seed = '', ...props }: SVGProps<SVGSVGElement> & { seed?: string }) {
  const rotation = Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 4 * 45;
  return <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" {...props}>
    <g transform={`rotate(${rotation} 32 32)`} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <path d="m32 7 22 16-8 27H18L10 23 32 7Z" opacity=".45" />
      <path d="m32 7 7 25 15-9M39 32l7 18M39 32l-21 18M39 32 10 23M18 50l14-43" />
      <circle cx="32" cy="7" r="3" fill="currentColor" stroke="none" />
      <circle cx="39" cy="32" r="4" fill="currentColor" stroke="none" />
      <circle cx="18" cy="50" r="3" fill="currentColor" stroke="none" />
    </g>
  </svg>;
}
