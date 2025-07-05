import { UsersClient } from "./components/users-client";
import HydrationWrapper from "@/components/hydration-wrapper";

const UsersPage = () => {
  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <HydrationWrapper>
          <UsersClient />
        </HydrationWrapper>
      </div>
    </div>
  );
};

export default UsersPage;
