import { cn } from '@/lib/utils';

type LogoSize = 'sm' | 'lg';

type Props = {
  size?: LogoSize;
  className?: string;
};

const sizeConfig = {
  sm: { icon: 20, wordmark: 'text-sm' },
  lg: { icon: 36, wordmark: 'text-xl' },
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
      <rect x="3" y="5" width="18" height="5" rx="2.5" className="fill-primary" />
      <rect x="3" y="7.5" width="18" height="2.5" className="fill-primary" />
      <line x1="8" y1="3" x2="8" y2="6.5" className="stroke-primary" strokeWidth="1.75" strokeLinecap="round" />
      <line x1="16" y1="3" x2="16" y2="6.5" className="stroke-primary" strokeWidth="1.75" strokeLinecap="round" />
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

function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('tracking-tight', className)}>
      <span className="font-bold text-foreground">Month</span>
      <span className="font-light text-primary">-</span>
      <span className="font-normal text-foreground">Track</span>
    </span>
  );
}

export function Logo({ size = 'sm', className }: Props) {
  const cfg = sizeConfig[size];

  if (size === 'lg') {
    return (
      <div
        className={cn('flex flex-col items-center gap-1.5', className)}
        role="img"
        aria-label="Month-Track"
      >
        <CalendarCheckIcon size={cfg.icon} />
        <Wordmark className={cfg.wordmark} />
      </div>
    );
  }

  return (
    <span
      className={cn('inline-flex items-center gap-2', className)}
      aria-label="Month-Track"
    >
      <CalendarCheckIcon size={cfg.icon} />
      <Wordmark className={cfg.wordmark} />
    </span>
  );
}
