export const getURL = (path = "") => {
  // Check if NEXT_PUBLIC_SITE_URL is set and non-empty. Set this to your site URL in production env.
  let url = process.env.NEXT_PUBLIC_SITE_URL;

  if (!url) throw new Error("Please provide the NEXT_PUBLIC_SITE_URL.");

  // Trim the URL and remove trailing slash if exists.
  url = url.replace(/\/+$/, "");
  // Make sure to include `https://` when not localhost.
  const newPath = path.replace(/^\/+/, "");

  // Concatenate the URL and the path.
  return newPath ? `${url}/${newPath}` : url;
};
