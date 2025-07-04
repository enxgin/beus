import { UserColumn } from "./components/columns";
import { UsersClient } from "./components/users-client";
import api from "@/lib/api";

// Prisma tiplerine olan bağımlılığı kaldırmak için tipi manuel olarak tanımlıyoruz.
interface UserWithBranch {
  id: string;
  name: string;
  email: string;
  role: string;
  branch: { name: string } | null;
}

const UsersPage = () => {
  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <UsersClient />
      </div>
    </div>
  );
};

export default UsersPage;
