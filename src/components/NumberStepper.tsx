"use client";

import React from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

interface NumberStepperProps {
  id?: string;
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function NumberStepper({
  id,
  value,
  onChange,
  min = 1,
  max = 100000,
  step = 1,
  suffix,
  placeholder,
  disabled = false,
  className = "",
}: NumberStepperProps) {
  const handleIncrement = () => {
    if (disabled) return;
    const next = Math.min(max, Number((value + step).toFixed(2)));
    onChange(next);
  };

  const handleDecrement = () => {
    if (disabled) return;
    const next = Math.max(min, Number((value - step).toFixed(2)));
    onChange(next);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "") {
      onChange(min);
      return;
    }
    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) {
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    if (isNaN(value) || value < min) {
      onChange(min);
    } else if (value > max) {
      onChange(max);
    }
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        step={step}
        value={isNaN(value) ? "" : value}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full pl-4 pr-16 py-3 rounded-xl bg-[#F7F7FB] dark:bg-[#17162A] border border-[#CFCFE0] dark:border-[#383556] text-sm font-bold text-[#12122A] dark:text-[#F4F3FA] focus:outline-none focus:border-[#5B3DF5] focus:bg-white dark:focus:bg-[#1C1B30] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-xs"
      />
      {suffix && (
        <span className="absolute right-12 text-xs font-semibold text-[#5A5A70] dark:text-[#A3A1BD] pointer-events-none select-none">
          {suffix}
        </span>
      )}
      <div className="absolute right-1.5 inset-y-1.5 flex flex-col justify-center border-l border-[#CFCFE0]/60 dark:border-[#383556] pl-1 z-10">
        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || value >= max}
          className="h-4 w-7 flex items-center justify-center rounded-t text-[#5A5A70] dark:text-[#C9C7E0] hover:text-[#5B3DF5] dark:hover:text-[#A38EFF] hover:bg-[#5B3DF5]/10 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
          title="Augmenter"
        >
          <ChevronUp className="h-3.5 w-3.5 stroke-[2.5]" />
        </button>
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || value <= min}
          className="h-4 w-7 flex items-center justify-center rounded-b text-[#5A5A70] dark:text-[#C9C7E0] hover:text-[#5B3DF5] dark:hover:text-[#A38EFF] hover:bg-[#5B3DF5]/10 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
          title="Diminuer"
        >
          <ChevronDown className="h-3.5 w-3.5 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
}

