"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarIcon, Check, ChevronsUpDown, X } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const paymentMethods = [
  { label: "Nakit", value: "CASH" },
  { label: "Kredi Kartı", value: "CREDIT_CARD" },
  { label: "Banka Transferi", value: "BANK_TRANSFER" },
  { label: "Müşteri Kredisi", value: "CUSTOMER_CREDIT" },
];

export interface PaymentFilters {
  startDate?: Date;
  endDate?: Date;
  customerId?: string;
  customerName?: string;
  method?: string;
}

interface PaymentFiltersProps {
  customers: Array<{ id: string; name: string }>;
  filters: PaymentFilters;
  onFilterChange: (filters: PaymentFilters) => void;
  onResetFilters: () => void;
}

export function PaymentFilters({
  customers,
  filters,
  onFilterChange,
  onResetFilters,
}: PaymentFiltersProps) {
  const [customerOpen, setCustomerOpen] = useState(false);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  const handleDateChange = (field: "startDate" | "endDate", date?: Date) => {
    onFilterChange({ ...filters, [field]: date });
  };

  const handleCustomerChange = (customerId: string, customerName: string) => {
    onFilterChange({ ...filters, customerId, customerName });
    setCustomerOpen(false);
  };

  const handleMethodChange = (method: string) => {
    // If ALL is selected, treat it as no filter
    if (method === "ALL") {
      const { method: _, ...restFilters } = filters;
      onFilterChange(restFilters);
    } else {
      onFilterChange({ ...filters, method });
    }
  };

  const activeFiltersCount = [
    filters.startDate,
    filters.endDate,
    filters.customerId,
    filters.method,
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="grid gap-2 flex-1">
          <Label htmlFor="start-date">Başlangıç Tarihi</Label>
          <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
            <PopoverTrigger asChild>
              <Button
                id="start-date"
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.startDate ? (
                  format(filters.startDate, "d MMMM yyyy", { locale: tr })
                ) : (
                  <span>Tarih seçin</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters.startDate}
                onSelect={(date) => {
                  handleDateChange("startDate", date);
                  setStartDateOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid gap-2 flex-1">
          <Label htmlFor="end-date">Bitiş Tarihi</Label>
          <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
            <PopoverTrigger asChild>
              <Button
                id="end-date"
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.endDate ? (
                  format(filters.endDate, "d MMMM yyyy", { locale: tr })
                ) : (
                  <span>Tarih seçin</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters.endDate}
                onSelect={(date) => {
                  handleDateChange("endDate", date);
                  setEndDateOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid gap-2 flex-1">
          <Label htmlFor="customer">Müşteri</Label>
          <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
            <PopoverTrigger asChild>
              <Button
                id="customer"
                variant="outline"
                role="combobox"
                aria-expanded={customerOpen}
                className="w-full justify-between"
              >
                {filters.customerName || "Müşteri seçin"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Müşteri ara..." />
                <CommandEmpty>Müşteri bulunamadı.</CommandEmpty>
                <CommandGroup className="max-h-64 overflow-y-auto">
                  {customers.map((customer) => (
                    <CommandItem
                      key={customer.id}
                      value={customer.name}
                      onSelect={() => handleCustomerChange(customer.id, customer.name)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          filters.customerId === customer.id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {customer.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid gap-2 flex-1">
          <Label htmlFor="payment-method">Ödeme Yöntemi</Label>
          <Select
            value={filters.method || ""}
            onValueChange={handleMethodChange}
          >
            <SelectTrigger id="payment-method">
              <SelectValue placeholder="Ödeme yöntemi seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tümü</SelectItem>
              {paymentMethods.map((method) => (
                <SelectItem key={method.value} value={method.value}>
                  {method.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeFiltersCount} aktif filtre
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onResetFilters}
          disabled={activeFiltersCount === 0}
        >
          <X className="mr-2 h-4 w-4" />
          Filtreleri Temizle
        </Button>
      </div>
    </div>
  );
}
