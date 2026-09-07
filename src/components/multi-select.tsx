"use client";

import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export interface MultiSelectOption {
  value: string;
  label: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  className,
  columns = 2,
}: {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  className?: string;
  columns?: 1 | 2 | 3;
}) {
  function toggle(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  return (
    <div
      className={cn(
        "grid gap-2 rounded-md border border-input p-3",
        columns === 1 && "grid-cols-1",
        columns === 2 && "grid-cols-1 sm:grid-cols-2",
        columns === 3 && "grid-cols-1 sm:grid-cols-3",
        className
      )}
    >
      {options.map((option) => (
        <div key={option.value} className="flex items-center gap-2">
          <Checkbox
            id={`ms-${option.value}`}
            checked={selected.includes(option.value)}
            onCheckedChange={() => toggle(option.value)}
          />
          <Label htmlFor={`ms-${option.value}`} className="cursor-pointer font-normal">
            {option.label}
          </Label>
        </div>
      ))}
    </div>
  );
}
