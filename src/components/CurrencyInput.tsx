import React, { forwardRef } from "react";
import { Input } from "@/components/ui/input";

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string;
  onChange?: (value: string) => void;
  currency?: string;
  showCurrency?: boolean;
  allowDecimals?: boolean;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value = "", onChange, currency = "$", showCurrency = true, allowDecimals = true, className, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const cleanedInput = inputValue.replace(currency, "").trim();
      const pattern = allowDecimals ? /[^0-9.,\s\-]/g : /[^0-9\s\-]/g;
      const sanitized = cleanedInput.replace(pattern, "");
      onChange?.(sanitized);
    };

    const displayValue = value && showCurrency ? `${value} ${currency}` : value;

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        className={className}
        {...props}
      />
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";
