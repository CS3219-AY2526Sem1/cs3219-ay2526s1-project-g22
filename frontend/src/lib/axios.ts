import axios from "axios";
import { createClient } from "./supabase/supabase-client";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const axiosInstance = axios.create({
  baseURL: apiUrl,
  timeout: 200_000,
});

// add a request interceptor to populate the access token in the headers
axiosInstance.interceptors.request.use(async (config) => {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();

  if (data?.session?.access_token) {
    // add the access token to the request headers
    config.headers.Authorization = `Bearer ${data.session.access_token}`;
  }

  return config;
});

export default axiosInstance;
