"use client";
import { IUser, useGetUser } from "@/queries/use-get-user";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect } from "react";

type TUserContext = {
  user: IUser | undefined;
  isLoading: boolean;
};
const UserContext = createContext<TUserContext | undefined>(undefined);
export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const { data: user, isLoading, refetch } = useGetUser();

  useEffect(() => {
    if (pathname) {
      refetch();
    }
  }, [pathname, refetch]);

  return (
    <UserContext.Provider value={{ user, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
