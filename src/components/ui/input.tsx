import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface InputProps extends React.ComponentProps<"input"> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, type = "text", ...props }, ref) => {
    const inputId = id || props.name;
    const isPassword = type === "password";
    const [showPassword, setShowPassword] = useState(false);

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
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={isPassword && showPassword ? "text" : type}
            className={`mt-1 block w-full bg-background px-3 py-2.5 text-sm text-foreground shadow-sm transition-colors placeholder:text-foreground/40 focus:outline-none ${
              error ? "border border-red-500" : "border border-foreground/20"
            } ${
              isPassword ? "pr-11" : ""
            } focus:border-foreground focus:ring-2 focus:ring-foreground/20 ${className}`}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((show) => !show)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-0 top-0 mt-1 flex h-[calc(100%-4px)] w-10 items-center justify-center text-foreground/50 transition-colors hover:bg-foreground/5 hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
