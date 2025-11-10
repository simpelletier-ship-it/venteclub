import { Input } from "@/components/ui/input";
import { forwardRef, useState, useEffect } from "react";

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string | number;
  onChange: (value: string) => void;
  showCurrency?: boolean;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, showCurrency = true, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState("");

    // Format number with spaces as thousand separators
    const formatNumber = (num: string | number): string => {
      if (!num && num !== 0) return "";
      const numStr = num.toString().replace(/\D/g, ""); // Remove non-digits
      if (!numStr) return "";
      
      // Add space every 3 digits from right
      const formatted = numStr.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
      return showCurrency ? `${formatted} $` : formatted;
    };

    // Parse formatted string back to raw number
    const parseNumber = (str: string): string => {
      return str.replace(/\D/g, "");
    };

    useEffect(() => {
      setDisplayValue(formatNumber(value));
    }, [value, showCurrency]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const rawValue = parseNumber(inputValue);
      
      // Update display with formatting
      setDisplayValue(formatNumber(rawValue));
      
      // Pass raw number to parent
      onChange(rawValue);
    };

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        value={displayValue}
        onChange={handleChange}
        placeholder={showCurrency ? "0 $" : "0"}
      />
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";
