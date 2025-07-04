import { useQuery } from "@tanstack/react-query";

interface Branch {
  id: string;
  name: string;
}

// Bu geçici bir şube verisi hook'udur.
// Gerçek uygulamanızda burayı kendi API'nizden veri çekecek şekilde değiştirmelisiniz.
const fetchBranches = async (): Promise<Branch[]> => {
  // Mock data
  const mockBranches: Branch[] = [
    { id: '1', name: 'Merkez Şube' },
    { id: '2', name: 'Kadıköy Şube' },
    { id: '3', name: 'Beşiktaş Şube' },
  ];
  
  // Gerçek API çağrısı için örnek:
  // const response = await api.get('/branches');
  // return response.data;

  return Promise.resolve(mockBranches);
};

export function useBranches() {
  return useQuery<Branch[], Error>({ 
    queryKey: ['branches'], 
    queryFn: fetchBranches 
  });
}
