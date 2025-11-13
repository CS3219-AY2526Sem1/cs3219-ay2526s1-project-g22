import axiosInstance from "@/lib/axios";
import { queryClient } from "@/providers/query-client-provider";
import { useMutation } from "@tanstack/react-query";

const microServiceEntryPoint = `/api/user-service`;
const baseUrl = `${microServiceEntryPoint}/v1/users`;

interface IUpdateUser {
  name: string;

  avatar_url?: string; // Optional field for avatar URL
}

export const useUpdateUser = () => {
  const mutation = useMutation({
    mutationFn: async (data: IUpdateUser) => {
      const response = await axiosInstance.put<IUpdateUser>(baseUrl, data);
      return response.data;
    },
  });
  return mutation;
};

export const invalidateUser = () => {
  return queryClient.invalidateQueries({ queryKey: ["/v1/users"] });
};
