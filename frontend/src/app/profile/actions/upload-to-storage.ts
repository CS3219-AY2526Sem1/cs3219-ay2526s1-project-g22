import { createClient } from "@/lib/supabase/supabase-client";

export const uploadToStorage = async (file: File, userId: string) => {
  const supabase = createClient();
  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}-${Math.random()}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("profile-pictures")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    throw uploadError;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("profile-pictures").getPublicUrl(filePath);

  return publicUrl;
};
