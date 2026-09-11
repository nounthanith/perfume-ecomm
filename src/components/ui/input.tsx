import { forwardRef } from "react";

interface InputProps extends React.ComponentProps<"input"> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1 block text-sm font-medium text-foreground"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`mt-1 block w-full rounded-lg border bg-background px-3 py-2.5 text-sm text-foreground shadow-sm transition-colors placeholder:text-foreground/40 focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 ${
            error ? "border-red-500" : "border-foreground/20"
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
