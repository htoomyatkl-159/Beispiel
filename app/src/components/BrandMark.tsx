import type { SVGProps } from 'react';

/** Beispiel's waveform monogram: a musical signal flowing into a bold B. */
export function BeispielMark(props: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 96 48" preserveAspectRatio="xMidYMid meet" fill="none" aria-hidden="true" {...props}>
    <defs><linearGradient id="beispiel-spectrum" x1="4" y1="24" x2="92" y2="24" gradientUnits="userSpaceOnUse"><stop stopColor="#54F7D5" /><stop offset=".28" stopColor="#1D9BFF" /><stop offset=".56" stopColor="#B13CFF" /><stop offset=".78" stopColor="#F4008A" /><stop offset="1" stopColor="#FFB52E" /></linearGradient></defs>
    <path d="M4 27c7 0 7-13 13-13s6 17 13 17 7-26 14-26 7 36 14 36 7-31 14-31c5 0 7 10 10 10" stroke="url(#beispiel-spectrum)" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M57 8h17c11 0 17 5 17 12 0 5-3 8-8 10 6 2 9 6 9 11 0 7-6 12-18 12H57V8Zm10 8v10h7c4 0 7-2 7-5s-3-5-7-5h-7Zm0 18v11h8c5 0 8-2 8-6s-3-5-8-5h-8Z" fill="url(#beispiel-spectrum)" />
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
