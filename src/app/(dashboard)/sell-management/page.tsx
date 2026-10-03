"use client";

import { useMemo, useState } from "react";
import {
  Banknote,
  Gauge,
  Receipt,
  ShoppingBag,
  ShoppingCart,
} from "lucide-react";
import Table, { type TableColumn } from "@/components/ui/table";
import Dialog from "@/components/ui/dialog";
import BarChart from "@/components/shared/BarChart";
import StatCard from "@/components/shared/StatCard";
import TopProducts from "@/components/shared/TopProducts";
import { useFetch } from "@/hooks/useFetch";
import {
  RANGE_LABELS,
  RANGE_PRESETS,
  getSalesRange,
  type RangePreset,
} from "@/lib/sales-range";
import type { IOrder, PaymentMethod } from "@/types/order.type";
import type { SalesReport } from "@/types/sales.type";

const PAGE_SIZE = 10;

type OrderRow = Omit<IOrder, "cashier"> & {
  cashier: {
    _id: string;
    name?: string;
    email?: string;
  } | null;
};

interface PaginationData {
  page: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface FetchResult {
  orders: OrderRow[];
  pagination: PaginationData;
}

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  card: "Card",
  transfer: "Transfer",
};

function formatDate(value?: Date | string) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(value: number) {
  return `$${Number(value).toFixed(2)}`;
}

export default function SellManagementPage() {
  const [page, setPage] = useState(1);
  const [preset, setPreset] = useState<RangePreset>("week");
  const [detail, setDetail] = useState<OrderRow | null>(null);

  const range = useMemo(() => getSalesRange(preset), [preset]);
  const from = range.from.toISOString();
  const to = range.to.toISOString();
  const tz = -new Date().getTimezoneOffset();

  const {
    data: report,
    loading: reportLoading,
    error: reportError,
    refetch: refetchReport,
  } = useFetch<SalesReport>("/api/orders/stats", {
    params: { preset, unit: range.unit, from, to, tz },
    cache: false,
  });

  const { data, loading, error, refetch } = useFetch<FetchResult>("/api/orders", {
    params: { page, limit: PAGE_SIZE, from, to },
    cache: false,
  });

  const orders = data?.orders ?? [];
  const totalPages = data?.pagination.totalPages ?? 1;
  const totalItems = data?.pagination.totalItems ?? 0;
  const summary = report?.summary;

  const changePage = (next: number) => {
    if (next === page) return;
    setPage(next);
  };

  const changePreset = (next: RangePreset) => {
    if (next === preset) return;
    setPreset(next);
    setPage(1);
  };

  const columns: TableColumn<OrderRow>[] = [
    {
      key: "order",
      header: "Order",
      render: (order) => (
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => setDetail(order)}
            title="View receipt"
            className="font-medium text-foreground hover:underline"
          >
            #{order.orderNumber}
          </button>
          <p className="truncate text-xs text-foreground/50">
            {formatDate(order.createdAt)}
          </p>
        </div>
      ),
    },
    {
      key: "items",
      header: "Items",
      render: (order) => (
        <span className="text-sm text-foreground/70">
          {order.items.reduce((sum, item) => sum + item.quantity, 0)} pcs
        </span>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      headerClassName: "hidden lg:table-cell",
      className: "hidden lg:table-cell",
      render: (order) => (
        <span className="text-sm text-foreground/70">
          {order.customerName || "Walk-in"}
        </span>
      ),
    },
    {
      key: "total",
      header: "Total",
      render: (order) => (
        <span className="font-semibold tabular-nums text-foreground">
          {formatCurrency(order.total)}
        </span>
      ),
    },
    {
      key: "payment",
      header: "Payment",
      render: (order) => (
        <span className="inline-flex items-center gap-1.5 text-sm text-foreground/70">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              order.paymentMethod === "cash" ? "bg-emerald-400" : "bg-sky-400"
            }`}
          />
          {PAYMENT_LABELS[order.paymentMethod]}
        </span>
      ),
    },
    {
      key: "cashier",
      header: "Cashier",
      headerClassName: "hidden md:table-cell",
      className: "hidden md:table-cell",
      render: (order) => (
        <span className="text-sm text-foreground/60">
          {order.cashier?.name || order.cashier?.email || "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-foreground/10 bg-foreground/5">
            <Receipt className="h-5 w-5 text-foreground/80" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              Sell Management
            </h1>
            <p className="text-sm text-foreground/60">
              Point-of-sale revenue and recent transactions
            </p>
          </div>
        </div>

        {/* Range filter */}
        <div
          role="group"
          aria-label="Filter sales by period"
          className="flex flex-wrap gap-1 rounded-xl border border-foreground/10 bg-foreground/[0.02] p-1"
        >
          {RANGE_PRESETS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => changePreset(option)}
              aria-pressed={option === preset}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                option === preset
                  ? "bg-background text-foreground shadow-sm"
                  : "text-foreground/60 hover:text-foreground"
              }`}
            >
              {RANGE_LABELS[option]}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      {reportError ? (
        <div className="flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600">
          <span>{reportError}</span>
          <button
            type="button"
            onClick={() => refetchReport()}
            className="font-medium underline hover:opacity-70"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Revenue"
            value={formatCurrency(summary?.revenue ?? 0)}
            icon={Banknote}
            hint={RANGE_LABELS[preset]}
          />
          <StatCard
            label="Orders"
            value={(summary?.orders ?? 0).toLocaleString()}
            icon={ShoppingBag}
            hint={RANGE_LABELS[preset]}
          />
          <StatCard
            label="Units Sold"
            value={(summary?.units ?? 0).toLocaleString()}
            icon={ShoppingCart}
            hint={RANGE_LABELS[preset]}
          />
          <StatCard
            label="Avg Order Value"
            value={formatCurrency(summary?.avgOrderValue ?? 0)}
            icon={Gauge}
            hint={RANGE_LABELS[preset]}
          />
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="overflow-hidden rounded-2xl border border-foreground/10 bg-background shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-foreground/10 bg-foreground/[0.02] px-5 py-3.5">
            <p className="text-sm font-medium text-foreground/80">
              Revenue over time
            </p>
            <span className="text-xs text-foreground/50">
              {RANGE_LABELS[preset]}
            </span>
          </div>
          <div className="px-5 py-5">
            {reportLoading && !report ? (
              <div className="h-[220px] animate-pulse rounded-xl bg-foreground/[0.07]" />
            ) : (
              <BarChart
                data={(report?.series ?? []).map((point) => ({
                  label: point.label,
                  title: point.title,
                  value: point.revenue,
                  meta: `${point.orders} ${point.orders === 1 ? "order" : "orders"}`,
                }))}
                formatValue={formatCurrency}
                emptyMessage={`No sales recorded ${RANGE_LABELS[preset].toLowerCase()}`}
              />
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-foreground/10 bg-background shadow-sm">
          <div className="flex items-center justify-between border-b border-foreground/10 bg-foreground/[0.02] px-5 py-3.5">
            <p className="text-sm font-medium text-foreground/80">Top Products</p>
            <span className="text-xs text-foreground/50">
              {RANGE_LABELS[preset]}
            </span>
          </div>
          <div className="px-5 py-5">
            {reportLoading && !report ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="space-y-2">
                    <div className="h-3.5 w-2/3 animate-pulse rounded bg-foreground/[0.07]" />
                    <div className="h-1.5 animate-pulse rounded-full bg-foreground/[0.07]" />
                  </div>
                ))}
              </div>
            ) : (
              <TopProducts
                data={report?.topProducts ?? []}
                formatCurrency={formatCurrency}
                emptyMessage={`Nothing sold ${RANGE_LABELS[preset].toLowerCase()}`}
              />
            )}
          </div>
        </section>
      </div>

      <Table
        columns={columns}
        data={orders}
        getRowKey={(order) => order._id}
        title="All Orders"
        count={totalItems}
        loading={loading}
        skeletonRows={6}
        error={error}
        onRetry={() => refetch()}
        empty={{
          icon: <ShoppingCart className="h-6 w-6 text-foreground/40" />,
          title: "No orders yet",
          message: `No transactions ${RANGE_LABELS[
            preset
          ].toLowerCase()}. Try a wider period.`,
        }}
        pagination={{
          page,
          totalPages,
          totalItems,
          limit: PAGE_SIZE,
          onPageChange: changePage,
          isLoading: loading,
        }}
      />

      <Dialog
        open={!!detail}
        onClose={() => setDetail(null)}
        title={`Receipt #${detail?.orderNumber ?? ""}`}
        className="max-w-sm"
      >
        {detail && (
          <div className="space-y-4 text-sm">
            <div className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/50">
                Items
              </p>
              <div className="space-y-1.5">
                {detail.items.map((item) => (
                  <div
                    key={String(item.product)}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="min-w-0 truncate text-foreground">
                      {item.quantity} × {item.name}
                    </span>
                    <span className="shrink-0 tabular-nums text-foreground/70">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 space-y-1 border-t border-dashed border-foreground/15 pt-2 text-xs">
                <div className="flex justify-between text-foreground/60">
                  <span>Subtotal</span>
                  <span className="tabular-nums">
                    {formatCurrency(detail.subtotal)}
                  </span>
                </div>
                {detail.discount > 0 && (
                  <div className="flex justify-between text-foreground/60">
                    <span>Discount</span>
                    <span className="tabular-nums">
                      -{formatCurrency(detail.discount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-foreground/60">
                  <span>Tax ({detail.taxRate}%)</span>
                  <span className="tabular-nums">
                    {formatCurrency(detail.taxAmount)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-foreground/10 pt-1.5 text-sm font-bold text-foreground">
                  <span>Total</span>
                  <span className="tabular-nums">
                    {formatCurrency(detail.total)}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <div>
                <p className="text-foreground/50">Customer</p>
                <p className="font-medium text-foreground">
                  {detail.customerName || "Walk-in"}
                </p>
              </div>
              <div>
                <p className="text-foreground/50">Phone</p>
                <p className="font-medium text-foreground">
                  {detail.customerPhone || "—"}
                </p>
              </div>
              <div>
                <p className="text-foreground/50">Payment</p>
                <p className="font-medium capitalize text-foreground">
                  {PAYMENT_LABELS[detail.paymentMethod]} ·{""}{" "}
                  {formatCurrency(detail.amountPaid)}
                </p>
              </div>
              <div>
                <p className="text-foreground/50">Cashier</p>
                <p className="font-medium text-foreground">
                  {detail.cashier?.name || "—"}
                </p>
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}