'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';

interface Branch {
  id: string;
  name: string;
}

interface BranchSelectorProps {
  value: string;
  onChange: (branchId: string) => void;
}

export function BranchSelector({ value, onChange }: BranchSelectorProps) {
  const [selectedBranchId, setSelectedBranchId] = useState<string>(value);

  // Şubeleri getir
  const { data: branches, isLoading } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: async () => {
      const { data } = await api.get('/branches');
      return data;
    },
  });

  // Seçilen şube değiştiğinde dışarıya bildir
  useEffect(() => {
    if (selectedBranchId) {
      onChange(selectedBranchId);
    }
  }, [selectedBranchId, onChange]);

  // Props'tan gelen value değişirse state'i güncelle
  useEffect(() => {
    if (value && value !== selectedBranchId) {
      setSelectedBranchId(value);
    }
  }, [value]);

  if (isLoading) {
    return <Skeleton className="h-10 w-[180px]" />;
  }

  return (
    <Select
      value={selectedBranchId}
      onValueChange={setSelectedBranchId}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Şube seçin" />
      </SelectTrigger>
      <SelectContent>
        {branches?.map((branch) => (
          <SelectItem key={branch.id} value={branch.id}>
            {branch.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
