"use client";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth";

export default function Home() {
  const logOut = async () => {
    await signOut();
  };
  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <Button onClick={logOut} className="px-12 py-6">
        Logout
      </Button>
    </div>
  );
}
