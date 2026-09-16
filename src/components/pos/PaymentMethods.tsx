import { Banknote, Check, CreditCard, Landmark } from "lucide-react";
import type { PaymentMethod } from "@/types/order.type";

interface PaymentMethodsProps {
  value: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
}

const METHODS: {
  value: PaymentMethod;
  label: string;
  icon: React.ElementType;
}[] = [
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "card", label: "Card", icon: CreditCard },
  { value: "transfer", label: "Transfer", icon: Landmark },
];

export default function PaymentMethods({ value, onChange }: PaymentMethodsProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {METHODS.map((method) => {
        const Icon = method.icon;
        const active = value === method.value;
        return (
          <button
            key={method.value}
            type="button"
            onClick={() => onChange(method.value)}
            className={`relative flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3.5 text-[13px] font-semibold transition-all active:scale-[0.97] ${
              active
                ? "border-foreground bg-foreground text-background shadow-md"
                : "border-foreground/10 bg-background text-foreground/70 hover:border-foreground/30 hover:text-foreground"
            }`}
          >
            {active && (
              <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-background text-foreground">
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
            )}
            <Icon className="h-5 w-5" />
            {method.label}
          </button>
        );
      })}
    </div>
  );
}