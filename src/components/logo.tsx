import { cn } from '@/lib/utils';

type LogoSize = 'sm' | 'lg';

type Props = {
  size?: LogoSize;
  className?: string;
};

const sizeConfig = {
  sm: { icon: 20, text: 'text-sm', gap: 'gap-2' },
  lg: { icon: 28, text: 'text-xl', gap: 'gap-2.5' },
} as const;

function CalendarCheckIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Calendar body */}
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="2.5"
        className="stroke-primary"
        strokeWidth="1.75"
        fill="none"
      />
      {/* Calendar top bar / header band */}
      <rect
        x="3"
        y="5"
        width="18"
        height="5"
        rx="2.5"
        className="fill-primary"
      />
      {/* Snap the bottom corners of the header to be square */}
      <rect x="3" y="7.5" width="18" height="2.5" className="fill-primary" />
      {/* Calendar pegs */}
      <line x1="8" y1="3" x2="8" y2="6.5" className="stroke-primary" strokeWidth="1.75" strokeLinecap="round" />
      <line x1="16" y1="3" x2="16" y2="6.5" className="stroke-primary" strokeWidth="1.75" strokeLinecap="round" />
      {/* Checkmark */}
      <polyline
        points="8.5,14.5 11,17 15.5,12.5"
        className="stroke-primary"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function Logo({ size = 'sm', className }: Props) {
  const cfg = sizeConfig[size];

  return (
    <span
      className={cn(
        'inline-flex items-center',
        cfg.gap,
        className,
      )}
      aria-label="Month-Track"
    >
      <CalendarCheckIcon size={cfg.icon} />
      <span className={cn(cfg.text, 'font-semibold tracking-tight text-foreground')}>
        Month-Track
      </span>
    </span>
  );
}
