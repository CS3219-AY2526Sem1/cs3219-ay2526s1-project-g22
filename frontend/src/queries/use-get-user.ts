import axiosInstance from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";

const microServiceEntryPoint = `/api/user-service`;
const baseUrl = `${microServiceEntryPoint}/v1/users`;

export interface IUser {
  id: string;
  email: string;
  // Add other user properties
  name: string;
  avatar_url?: string; // Optional field for avatar URL
}
export const useGetUser = () => {
  const query = useQuery({
    queryKey: ["/v1/users"],
    queryFn: async () => {
      const response = await axiosInstance.get<IUser>(baseUrl);
      return response.data;
    },
  });
  return query;
};
