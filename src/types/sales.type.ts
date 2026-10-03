import type { BucketUnit, RangePreset } from "@/lib/sales-range";

export interface SalesPoint {
  key: string;
  label: string;
  title: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  id: string;
  name: string;
  units: number;
  revenue: number;
}

export interface SalesReport {
  range: {
    preset: RangePreset;
    from: string;
    to: string;
    unit: BucketUnit;
  };
  summary: {
    revenue: number;
    orders: number;
    units: number;
    avgOrderValue: number;
  };
  series: SalesPoint[];
  topProducts: TopProduct[];
}