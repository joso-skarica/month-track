import { cn } from '@/lib/utils';

type PageHeaderProps = {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border/90 bg-card px-5 py-4 shadow-sm sm:px-6 sm:py-5',
        className,
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-primary/70">
              {eyebrow}
            </p>
          )}
          <h1 className="font-sans text-[1.375rem] font-medium leading-tight text-foreground sm:text-[1.625rem]">
            {title}
          </h1>
          {subtitle && (
            <div className="mt-1 max-w-2xl text-[0.8125rem] leading-normal text-muted-foreground/80">
              {subtitle}
            </div>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
