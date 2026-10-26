'use client';

/**
 * Renders a raw SVG string (from the background/character generators)
 * inside a div. Must use dangerouslySetInnerHTML so the browser parses
 * the markup instead of escaping it as text.
 */
export function SvgInline({ svg, className }: { svg: string; className?: string }) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: svg }} />;
}
