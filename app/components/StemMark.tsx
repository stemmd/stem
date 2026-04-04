interface StemMarkProps {
  size?: number;
}

const STROKE_WIDTH: Record<number, number> = {
  16: 6,
  24: 5,
  36: 4.5,
  48: 4,
  80: 3.5,
};

export function StemMark({ size = 48 }: StemMarkProps) {
  const sw = STROKE_WIDTH[size] ?? 4;
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: size, height: size, flexShrink: 0 }}
    >
      <line x1="32" y1="68" x2="32" y2="42" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" />
      <line x1="32" y1="20" x2="32" y2="42" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" />
      <path d="M32 42 Q46 38 52 28" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" fill="none" />
    </svg>
  );
}
