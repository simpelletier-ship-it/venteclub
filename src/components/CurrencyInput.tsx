import { Input } from "@/components/ui/input";
import { forwardRef, useState, useEffect } from "react";

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string | number;
  onChange: (value: string) => void;
  showCurrency?: boolean;
  allowDecimals?: boolean;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, showCurrency = true, allowDecimals = true, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState("");

    // Format number with spaces as thousand separators and optional decimals
    const formatNumber = (num: string | number): string => {
      if (!num && num !== 0) return "";
      let numStr = num.toString();
      
      if (allowDecimals) {
        // Handle decimals - keep only numbers and one decimal point
        numStr = numStr.replace(/[^\d.,]/g, "").replace(",", ".");
        const parts = numStr.split(".");
        const integerPart = parts[0].replace(/\D/g, "");
        const decimalPart = parts[1]?.slice(0, 2) || "";
        
        if (!integerPart && !decimalPart) return "";
        
        // Format integer part with spaces
        const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        const formatted = decimalPart || numStr.includes(".") 
          ? `${formattedInteger || "0"},${decimalPart}` 
          : formattedInteger;
        
        return showCurrency ? `${formatted} $` : formatted;
      } else {
        numStr = numStr.replace(/\D/g, "");
        if (!numStr) return "";
        const formatted = numStr.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        return showCurrency ? `${formatted} $` : formatted;
      }
    };

    // Parse formatted string back to raw number
    const parseNumber = (str: string): string => {
      if (allowDecimals) {
        // Replace comma with dot for decimal, keep digits and decimal point
        const cleaned = str.replace(/[^\d.,]/g, "").replace(",", ".");
        const parts = cleaned.split(".");
        const integerPart = parts[0];
        const decimalPart = parts[1]?.slice(0, 2);
        
        if (decimalPart !== undefined) {
          return `${integerPart}.${decimalPart}`;
        }
        return integerPart;
      }
      return str.replace(/\D/g, "");
    };

    useEffect(() => {
      setDisplayValue(formatNumber(value));
    }, [value, showCurrency, allowDecimals]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const rawValue = parseNumber(inputValue);
      
      // Update display with formatting
      setDisplayValue(formatNumber(rawValue));
      
      // Pass raw number to parent
      onChange(rawValue);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow comma/period for decimals
      if (allowDecimals && (e.key === "," || e.key === ".")) {
        if (displayValue.includes(",")) {
          e.preventDefault();
        }
        return;
      }
      
      // Allow backspace/delete even if cursor is after $ sign
      if (e.key === 'Backspace' || e.key === 'Delete') {
        const input = e.currentTarget;
        const cursorPosition = input.selectionStart || 0;
        const value = input.value;
        
        // If cursor is at the end (after $), delete last character
        if (cursorPosition === value.length) {
          e.preventDefault();
          const rawValue = parseNumber(value);
          if (rawValue.length <= 1) {
            setDisplayValue("");
            onChange("");
          } else {
            const newValue = rawValue.slice(0, -1);
            setDisplayValue(formatNumber(newValue));
            onChange(newValue);
          }
        }
      }
    };

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={showCurrency ? "0,00 $" : "0,00"}
      />
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";
