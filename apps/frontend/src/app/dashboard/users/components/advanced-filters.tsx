"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Filter, RotateCcw } from "lucide-react";
import { UserRole } from "@/types/user";
import { useBranches } from "../../branches/hooks/use-branches";
import { useAuthStore } from "@/stores/auth.store";

interface FilterState {
  dateFrom: string;
  dateTo: string;
  roles: UserRole[];
  performance: 'high' | 'medium' | 'low' | 'all';
  branchId?: string;
}

interface AdvancedFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  initialFilters?: Partial<FilterState>;
}

const roleOptions = [
  { value: UserRole.ADMIN, label: 'Admin' },
  { value: UserRole.SUPER_BRANCH_MANAGER, label: 'Üst Şube Yöneticisi' },
  { value: UserRole.BRANCH_MANAGER, label: 'Şube Yöneticisi' },
  { value: UserRole.RECEPTION, label: 'Resepsiyon' },
  { value: UserRole.STAFF, label: 'Personel' },
];

const performanceOptions = [
  { value: 'all', label: 'Tüm Performanslar' },
  { value: 'high', label: 'Yüksek Performans (70+)' },
  { value: 'medium', label: 'Orta Performans (40-69)' },
  { value: 'low', label: 'Düşük Performans (<40)' },
];

export const AdvancedFilters = ({ onFiltersChange, initialFilters }: AdvancedFiltersProps) => {
  const { user: currentUser } = useAuthStore();
  const { data: branchesData } = useBranches();
  
  // Varsayılan tarih aralığı: Bu ay
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [filters, setFilters] = useState<FilterState>({
    dateFrom: initialFilters?.dateFrom || startOfMonth.toISOString().split('T')[0],
    dateTo: initialFilters?.dateTo || endOfMonth.toISOString().split('T')[0],
    roles: initialFilters?.roles || [],
    performance: initialFilters?.performance || 'all',
    branchId: initialFilters?.branchId,
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleRoleToggle = (role: UserRole) => {
    const newRoles = filters.roles.includes(role)
      ? filters.roles.filter(r => r !== role)
      : [...filters.roles, role];
    handleFilterChange('roles', newRoles);
  };

  const handleReset = () => {
    const defaultFilters: FilterState = {
      dateFrom: startOfMonth.toISOString().split('T')[0],
      dateTo: endOfMonth.toISOString().split('T')[0],
      roles: [],
      performance: 'all',
      branchId: undefined,
    };
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.roles.length > 0) count++;
    if (filters.performance !== 'all') count++;
    if (filters.branchId) count++;
    return count;
  };

  const branches = branchesData || [];
  const showBranchFilter = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.SUPER_BRANCH_MANAGER;

  return (
    <Card className="p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="font-medium">Filtreler</span>
          {getActiveFilterCount() > 0 && (
            <Badge variant="secondary" className="text-xs">
              {getActiveFilterCount()} aktif
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="text-xs"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Sıfırla
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs"
          >
            {isExpanded ? 'Daralt' : 'Genişlet'}
          </Button>
        </div>
      </div>

      {/* Tarih Aralığı - Her zaman görünür */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <Label htmlFor="dateFrom">Başlangıç Tarihi</Label>
          <Input
            id="dateFrom"
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dateTo">Bitiş Tarihi</Label>
          <Input
            id="dateTo"
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
          />
        </div>
      </div>

      {/* Genişletilmiş Filtreler */}
      {isExpanded && (
        <div className="space-y-4 border-t pt-4">
          {/* Rol Filtreleri */}
          <div className="space-y-2">
            <Label>Roller</Label>
            <div className="flex flex-wrap gap-2">
              {roleOptions.map((role) => (
                <Badge
                  key={role.value}
                  variant={filters.roles.includes(role.value) ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/80"
                  onClick={() => handleRoleToggle(role.value)}
                >
                  {role.label}
                  {filters.roles.includes(role.value) && (
                    <X className="h-3 w-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Performans Filtresi */}
          <div className="space-y-2">
            <Label>Performans</Label>
            <Select
              value={filters.performance}
              onValueChange={(value: any) => handleFilterChange('performance', value)}
            >
              <SelectTrigger className="w-full md:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {performanceOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Şube Filtresi - Sadece Admin ve Üst Şube Yöneticisi için */}
          {showBranchFilter && (
            <div className="space-y-2">
              <Label>Şube</Label>
              <Select
                value={filters.branchId || ""}
                onValueChange={(value) => handleFilterChange('branchId', value || undefined)}
              >
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue placeholder="Tüm şubeler" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tüm şubeler</SelectItem>
                  {branches.map((branch: any) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};