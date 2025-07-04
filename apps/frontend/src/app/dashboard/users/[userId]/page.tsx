"use client";

import { useEffect, useState } from 'react';
import { useParams } from "next/navigation";
import { UserForm } from "./components/user-form";
import { getUserPageData, UserRole } from './data';
import { Skeleton } from "@/components/ui/skeleton";

// Client Component olarak kullanıyoruz
export default function UserPage() {
  // Next.js'in useParams hook'unu kullanıyoruz
  const params = useParams();
  const userId = params.userId as string;
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<{
    user: any | null;
    roles: { id: UserRole; name: string }[];
    branches: { id: string; name: string }[];
  }>({ 
    user: null, 
    roles: [], 
    branches: [] 
  });
  
  useEffect(() => {
    // Client tarafında veri çekme işlemi
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const result = await getUserPageData(userId);
        setData(result);
      } catch (error) {
        console.error("Veri çekme hatası:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [userId]);
  
  if (isLoading) {
    return (
      <div className="flex-col">
        <div className="flex-1 space-y-4 p-8 pt-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <UserForm 
          initialData={data.user} 
          roles={data.roles} 
          branches={data.branches} 
        />
      </div>
    </div>
  );
}
