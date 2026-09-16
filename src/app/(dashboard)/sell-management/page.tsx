"use client";

import { useState } from "react";
import { Receipt, ShoppingCart } from "lucide-react";
import Table, { type TableColumn } from "@/components/ui/table";
import Dialog from "@/components/ui/dialog";
import { useFetch } from "@/hooks/useFetch";
import type { IOrder, PaymentMethod } from "@/types/order.type";

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

  const { data, loading, error, refetch } = useFetch<FetchResult>(
    "/api/orders",
    {
      params: { page, limit: PAGE_SIZE },
      cache: false,
    }
  );

  const orders = data?.orders ?? [];
  const totalPages = data?.pagination.totalPages ?? 1;
  const totalItems = data?.pagination.totalItems ?? 0;

  const [detail, setDetail] = useState<OrderRow | null>(null);

  const changePage = (next: number) => {
    if (next === page) return;
    setPage(next);
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
        <span className="font-semibold text-foreground">
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
              Recent point-of-sale transactions
            </p>
          </div>
        </div>
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
          message: "Orders placed at the POS will appear here.",
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
                  {PAYMENT_LABELS[detail.paymentMethod]} ·{" "}
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