import { UsersClient } from "./components/users-client";
import HydrationWrapper from "@/components/hydration-wrapper";

const UsersPage = () => {
  return (
    <div className="space-y-6">
      <HydrationWrapper>
        <UsersClient />
      </HydrationWrapper>
    </div>
  );
};

export default UsersPage;
