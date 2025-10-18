/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@supabase/ssr", "@supabase/supabase-js"],
};

module.exports = nextConfig;
