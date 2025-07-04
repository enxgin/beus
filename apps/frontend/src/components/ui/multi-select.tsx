"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface Option {
  value: string;
  label: string;
}

export interface MultiSelectProps {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
  emptyIndicator?: string;
}

// ID'nin geçerli olup olmadığını kontrol eden yardımcı fonksiyon
const isValidID = (id: string): boolean => {
  // Boş olmaması yeterli
  return !!id && id.trim() !== "";
};

const MultiSelect = React.forwardRef<HTMLDivElement, MultiSelectProps>(
  ({ options, selected, onChange, className, placeholder, emptyIndicator }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Seçili öğeleri kaldırma işlemi
    const removeItem = (value: string) => {
      onChange(selected.filter(item => item !== value));
    };
    
    // Öğe seçme işlemi
    const selectItem = (value: string) => {
      console.log("Seçilmeye çalışılan personel ID:", value);
      
      // ID'nin geçerli olup olmadığını kontrol et
      if (!value || !isValidID(value)) {
        console.error("Geçersiz ID değeri:", value);
        return;
      }
      
      // Zaten seçili değilse listeye ekle
      if (!selected.includes(value)) {
        const newSelected = [...selected, value];
        console.log("Yeni seçili personel listesi:", newSelected);
        onChange(newSelected);
      } else {
        console.log("Bu personel zaten seçili:", value);
      }
      
      // Seçim yapıldığında dropdown'u kapat
      setIsOpen(false);
    };

    // Dış tıklamaları izleme
    React.useEffect(() => {
      const handleOutsideClick = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      
      document.addEventListener("mousedown", handleOutsideClick);
      return () => {
        document.removeEventListener("mousedown", handleOutsideClick);
      };
    }, []);

    // Seçilmemiş öğeler
    const availableOptions = options.filter(option => !selected.includes(option.value));

    return (
      <div ref={containerRef} className="relative w-full">
        {/* Seçici kutu */}
        <div 
          className="flex flex-wrap gap-2 p-2 min-h-10 w-full border rounded-md cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          {selected.length > 0 ? (
            selected.map((value) => {
              const option = options.find((o) => o.value === value);
              return (
                <Badge key={value} variant="secondary" className="flex items-center gap-1">
                  {option?.label || value}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeItem(value);
                    }}
                    className="rounded-full hover:bg-accent w-4 h-4 inline-flex items-center justify-center"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })
          ) : (
            <div className="text-muted-foreground">{placeholder || "Seçim yapın..."}</div>
          )}
        </div>
        
        {/* Açılır liste */}
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 p-1 bg-background border rounded-md shadow-md max-h-[200px] overflow-auto">
            {availableOptions.length > 0 ? (
              availableOptions.map((option) => (
                <div
                  key={option.value}
                  className="px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-sm text-sm flex items-center justify-between transition-colors duration-150"
                  onClick={() => selectItem(option.value)}
                >
                  <span>{option.label}</span>
                  <span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5 ml-2">
                    Seç
                  </span>
                </div>
              ))
            ) : (
              <div className="p-2 text-center text-sm text-muted-foreground">
                {emptyIndicator || "Seçilebilecek personel bulunamadı"}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

MultiSelect.displayName = "MultiSelect";

export { MultiSelect };
