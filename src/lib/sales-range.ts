export const RANGE_PRESETS = [
  "today",
  "yesterday",
  "week",
  "month",
  "year",
] as const;

export type RangePreset = (typeof RANGE_PRESETS)[number];

export type BucketUnit = "hour" | "day" | "month";

export const RANGE_LABELS: Record<RangePreset, string> = {
  today: "Today",
  yesterday: "Yesterday",
  week: "Last 7 Days",
  month: "Last 30 Days",
  year: "Last 12 Months",
};

export const BUCKET_FORMATS: Record<BucketUnit, string> = {
  hour: "%Y-%m-%d %H",
  day: "%Y-%m-%d",
  month: "%Y-%m",
};

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

export const MAX_RANGE_DAYS = 400;

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export interface SalesRange {
  preset: RangePreset;
  from: Date;
  to: Date;
  unit: BucketUnit;
}

export interface SalesBucket {
  key: string;
  label: string;
  title: string;
}

export function isRangePreset(value: unknown): value is RangePreset {
  return (
    typeof value === "string" && (RANGE_PRESETS as readonly string[]).includes(value)
  );
}

export function isBucketUnit(value: unknown): value is BucketUnit {
  return value === "hour" || value === "day" || value === "month";
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function formatHour(hour: number) {
  const suffix = hour < 12 ? "AM" : "PM";
  const value = hour % 12 === 0 ? 12 : hour % 12;
  return `${value} ${suffix}`;
}

/**
 * Resolves a preset into concrete local-time boundaries.
 * Runs on the client so the boundaries follow the shop's timezone;
 * the resulting instants are sent to the API as ISO strings.
 */
export function getSalesRange(preset: RangePreset, now: Date = new Date()): SalesRange {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case "today":
      return { preset, from: today, to: now, unit: "hour" };
    case "yesterday":
      return { preset, from: addDays(today, -1), to: today, unit: "hour" };
    case "week":
      return {
        preset,
        from: addDays(today, -6),
        to: addDays(today, 1),
        unit: "day",
      };
    case "month":
      return {
        preset,
        from: addDays(today, -29),
        to: addDays(today, 1),
        unit: "day",
      };
    case "year":
      return {
        preset,
        from: new Date(today.getFullYear(), today.getMonth() - 11, 1),
        to: new Date(today.getFullYear(), today.getMonth() + 1, 1),
        unit: "month",
      };
  }
}

/**
 * Builds every bucket key between two instants so the chart keeps a
 * continuous axis even when a period has no orders.
 *
 * @param tzOffsetMinutes Minutes to add to UTC to get shop-local time (e.g. 360 for UTC+6).
 */
export function buildBuckets(
  from: Date,
  to: Date,
  unit: BucketUnit,
  tzOffsetMinutes: number
): SalesBucket[] {
  const tz = tzOffsetMinutes * MINUTE;
  const buckets: SalesBucket[] = [];

  if (unit === "hour") {
    let cursor = Math.floor((from.getTime() + tz) / HOUR) * HOUR - tz;

    while (cursor < to.getTime()) {
      const shifted = new Date(cursor + tz);
      buckets.push({
        key: `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(
          shifted.getUTCDate()
        )} ${pad(shifted.getUTCHours())}`,
        label: formatHour(shifted.getUTCHours()),
        title: `${WEEKDAYS[shifted.getUTCDay()]}, ${MONTHS[shifted.getUTCMonth()]} ${shifted.getUTCDate()} · ${formatHour(
          shifted.getUTCHours()
        )}`,
      });
      cursor += HOUR;
    }

    return buckets;
  }

  if (unit === "day") {
    const anchor = new Date(from.getTime() + tz);
    let year = anchor.getUTCFullYear();
    let month = anchor.getUTCMonth();
    let day = anchor.getUTCDate();

    for (;;) {
      if (Date.UTC(year, month, day) - tz >= to.getTime()) break;

      buckets.push({
        key: `${year}-${pad(month + 1)}-${pad(day)}`,
        label: `${WEEKDAYS[new Date(Date.UTC(year, month, day)).getUTCDay()]} ${day}`,
        title: `${WEEKDAYS[new Date(Date.UTC(year, month, day)).getUTCDay()]}, ${
          MONTHS[month]
        } ${day}, ${year}`,
      });

      const next = new Date(Date.UTC(year, month, day + 1));
      year = next.getUTCFullYear();
      month = next.getUTCMonth();
      day = next.getUTCDate();
    }

    return buckets;
  }

  const anchor = new Date(from.getTime() + tz);
  let year = anchor.getUTCFullYear();
  let month = anchor.getUTCMonth();

  for (;;) {
    if (Date.UTC(year, month, 1) - tz >= to.getTime()) break;

    buckets.push({
      key: `${year}-${pad(month + 1)}`,
      label: MONTHS[month],
      title: `${MONTHS[month]} ${year}`,
    });

    const next = new Date(Date.UTC(year, month + 1, 1));
    year = next.getUTCFullYear();
    month = next.getUTCMonth();
  }

  return buckets;
}