"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface FoodSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSearch?: () => void;
  debounceMs?: number;
}

export function FoodSearchInput({
  value,
  onChange,
  placeholder = "食品名で検索...",
  onSearch,
  debounceMs = 300,
}: FoodSearchInputProps) {
  const [localValue, setLocalValue] = useState(value);

  // 外部からのvalue変更を反映
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // デバウンス処理
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, value, onChange, debounceMs]);

  const handleClear = useCallback(() => {
    setLocalValue("");
    onChange("");
  }, [onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && onSearch) {
        e.preventDefault();
        onChange(localValue);
        onSearch();
      }
    },
    [localValue, onChange, onSearch]
  );

  return (
    <div className="relative">
      <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
      <Input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="pr-9 pl-9"
      />
      {localValue && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={handleClear}
          className="absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">クリア</span>
        </Button>
      )}
    </div>
  );
}
