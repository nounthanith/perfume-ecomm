"use client";

export interface BarChartPoint {
  label: string;
  title: string;
  value: number;
  meta?: string;
}

interface BarChartProps {
  data: BarChartPoint[];
  formatValue?: (value: number) => string;
  height?: number;
  emptyMessage?: string;
  valueLabel?: string;
}

const GRID_LINES = 4;
const MAX_LABELS = 8;

export default function BarChart({
  data,
  formatValue = (value) => value.toLocaleString(),
  height = 220,
  emptyMessage = "No sales in this period",
  valueLabel = "Revenue",
}: BarChartProps) {
  const max = Math.max(...data.map((point) => point.value), 0);
  const labelStep = Math.max(1, Math.ceil(data.length / MAX_LABELS));

  if (data.length === 0 || max === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-foreground/15 text-center" style={{ height }}>
        <p className="text-sm font-medium text-foreground/60">{emptyMessage}</p>
        <p className="text-xs text-foreground/40">Try a wider date range</p>
      </div>
    );
  }

  const ticks = Array.from({ length: GRID_LINES + 1 }, (_, index) => {
    const ratio = index / GRID_LINES;
    return { ratio, value: max * (1 - ratio) };
  });

  return (
    <div className="flex gap-3">
      {/* Y axis */}
      <div
        className="flex w-14 shrink-0 flex-col justify-between text-right text-[10px] tabular-nums text-foreground/40"
        style={{ height }}
      >
        {ticks.map((tick) => (
          <span key={tick.ratio}>{formatValue(Math.round(tick.value))}</span>
        ))}
      </div>

      {/* Plot */}
      <div className="min-w-0 flex-1">
        <div className="relative" style={{ height }}>
          {ticks.map((tick) => (
            <div
              key={tick.ratio}
              className="pointer-events-none absolute inset-x-0 border-t border-dashed border-foreground/10"
              style={{ bottom: `${tick.ratio * 100}%` }}
            />
          ))}

          <div className="absolute inset-0 flex items-end gap-1">
            {data.map((point, index) => {
              const percent = (point.value / max) * 100;
              const isPeak = point.value === max;

              return (
                <div
                  key={`${point.title}-${index}`}
                  className="group relative flex h-full flex-1 items-end justify-center"
                >
                  <div
                    className={`w-full rounded-t-md transition-colors ${
                      isPeak
                        ? "bg-foreground group-hover:bg-foreground/80"
                        : "bg-foreground/35 group-hover:bg-foreground/70"
                    }`}
                    style={{ height: point.value > 0 ? `${Math.max(percent, 2)}%` : "0" }}
                  />

                  <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-foreground/10 bg-background px-2.5 py-1.5 text-center shadow-lg group-hover:block">
                    <p className="text-[10px] uppercase tracking-wider text-foreground/50">
                      {point.title}
                    </p>
                    <p className="text-sm font-semibold tabular-nums text-foreground">
                      {formatValue(point.value)}
                    </p>
                    {point.meta && (
                      <p className="text-[11px] text-foreground/50">{point.meta}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* X axis */}
        <div className="mt-2 flex gap-1">
          {data.map((point, index) => (
            <div
              key={`${point.title}-label-${index}`}
              className="flex-1 truncate text-center text-[10px] tabular-nums text-foreground/40"
            >
              {index % labelStep === 0 ? point.label : ""}
            </div>
          ))}
        </div>

        <p className="mt-3 text-xs text-foreground/40">
          {valueLabel} · peak {formatValue(Math.round(max))}
        </p>
      </div>
    </div>
  );
}