/*
AI Assistance Disclosure:
Tool: Deepseek R1
Date: 2025-09-22
Scope: Reviewed the code structure and caught a few minor issues, then suggested small improvements.
Author review: I verified correctness of the modifications by AI against requirements — I debugged UI styling and confirmed the component renders correctly.
*/
"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Code2, History } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/contexts/user-context";
import { signOut } from "@/lib/auth";

export default function Header() {
  const { user } = useUser();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-blue-800/30 bg-slate-900/50 backdrop-blur-sm px-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/">
            <div className="flex items-center">
              <Code2 className="h-6 w-6 text-blue-400" />
              <span className="ml-2 text-lg font-semibold text-white">
                CodeCollab
              </span>
            </div>
          </Link>
          <div className="flex items-center space-x-3">
            <Link href="/history">
              <Button className="hover:bg-slate-800">
                <History className="mr-2 h-4 w-4" />
                History
              </Button>
            </Link>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full p-0"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={
                        user?.avatar_url ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${
                          user?.name || user?.email
                        }`
                      }
                      alt={user?.name || "User"}
                    />
                    <AvatarFallback className="text-sm font-medium">
                      {user?.name?.charAt(0) ||
                        user?.email?.charAt(0).toUpperCase() ||
                        "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.name || "User"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/matchhistory" className="flex items-center">
                    <History className="mr-2 h-4 w-4" />
                    <span>Match History</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
