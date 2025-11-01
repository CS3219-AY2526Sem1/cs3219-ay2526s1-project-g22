"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit2, Trophy, Target, Upload, Loader2 } from "lucide-react";
import { useUser } from "@/contexts/user-context";
import { useState, useRef } from "react";
import Header from "../_components/Header";
import Footer from "../_components/Footer";
import { invalidateUser, useUpdateUser } from "@/mutations/use-update-user";
import { showToast } from "@/utils/toast-helper";
import { useRouter } from "next/navigation";
import QuestionStats from "./_components/QuestionStats";
import ProgressBar from "./_components/ProgressBar";
import { uploadToStorage } from "./actions/upload-to-storage";
import { useGetHistoryData } from "@/queries/use-get-history-data";

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useUser();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editForm, setEditForm] = useState({
    name: user?.name || "",
  });
  const { mutateAsync: updateUser } = useUpdateUser();

  const { data, isLoading: sessionsLoading } = useGetHistoryData();

  // Mock data for questions solved - replace with actual data from your backend
  const questionsStats = {
    total: data ? data.length : 0,
    easy: data
      ? data.filter((q) => q.question.difficulty === "Easy").length
      : 0,
    medium: data
      ? data.filter((q) => q.question.difficulty === "Medium").length
      : 0,
    hard: data
      ? data.filter((q) => q.question.difficulty === "Hard").length
      : 0,
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      showToast("Please select a valid image file (JPEG, PNG, GIF, or WebP)", {
        success: false,
      });
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      showToast("File size must be less than 5MB", {
        success: false,
      });
      return;
    }

    setIsUploadingAvatar(true);

    try {
      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);

      // Upload to Supabase Storage
      const avatarUrl = await uploadToStorage(file, user?.id || "");

      // Update user profile with new avatar URL
      await updateUser({
        name: user?.name || "",
        avatar_url: avatarUrl,
      });

      showToast("Profile picture updated successfully", {
        success: true,
      });

      invalidateUser();
    } catch (error) {
      showToast("Failed to update profile picture", {
        success: false,
      });
      setAvatarPreview(null);
    } finally {
      setIsUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUser(editForm);
      showToast("Profile updated successfully", {
        success: true,
      });
      invalidateUser();
    } catch (error) {
      console.error("Error updating user:", error);
    } finally {
      setIsEditDialogOpen(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (sessionsLoading) {
    return (
      <div className="flex flex-col w-full min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
        <div className="text-white text-lg">Loading data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex flex-col">
      <Header />
      <main className="flex-grow">
        <div className="container mx-auto py-8 px-4 max-w-4xl">
          <div className="space-y-8">
            {/* Profile Header */}
            <Card className="bg-slate-800/50 border-blue-800/30 backdrop-blur-sm">
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div className="relative">
                    <Avatar
                      className="h-24 w-24 cursor-pointer transition-all hover:opacity-80 hover:scale-105"
                      onClick={handleAvatarClick}
                    >
                      <AvatarImage
                        src={
                          avatarPreview ||
                          user?.avatar_url ||
                          `https://api.dicebear.com/7.x/initials/svg?seed=${
                            user?.name || user?.email
                          }`
                        }
                        alt={user?.name || "User"}
                      />
                      <AvatarFallback className="text-2xl">
                        {user?.name?.charAt(0) ||
                          user?.email?.charAt(0).toUpperCase() ||
                          "U"}
                      </AvatarFallback>
                    </Avatar>

                    {/* Upload overlay */}
                    <div
                      className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                      onClick={handleAvatarClick}
                    >
                      {isUploadingAvatar ? (
                        <Loader2 className="h-6 w-6 text-white animate-spin" />
                      ) : (
                        <Upload className="h-6 w-6 text-white" />
                      )}
                    </div>

                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={isUploadingAvatar}
                    />
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h1 className="text-3xl font-bold text-white">
                          {user?.name || "User"}
                        </h1>
                        <p className="text-sm text-gray-300 mt-1">
                          Click on your avatar to change your profile picture
                        </p>
                      </div>

                      <Dialog
                        open={isEditDialogOpen}
                        onOpenChange={setIsEditDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                            <Edit2 className="h-4 w-4" />
                            Edit Profile
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Edit Profile</DialogTitle>
                            <DialogDescription>
                              Make changes to your profile here. Click save when
                              you&apos;re done.
                            </DialogDescription>
                          </DialogHeader>
                          <form
                            onSubmit={handleEditSubmit}
                            className="space-y-4"
                          >
                            <div className="space-y-2">
                              <Label htmlFor="name">Display Name</Label>
                              <Input
                                id="name"
                                name="name"
                                value={editForm.name}
                                onChange={handleInputChange}
                                placeholder="Enter your display name"
                              />
                            </div>
                            <div
                              className="text-blue-500 hover:underline cursor-pointer"
                              onClick={() => router.push("/reset-password")}
                            >
                              <p className="text-sm -mt-2">Change Password</p>
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEditDialogOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button type="submit">Save Changes</Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Rest of your existing code for Questions Solved Statistics */}
            <Card className="bg-slate-800/50 border-blue-800/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Questions Solved
                </CardTitle>
                <CardDescription className="text-gray-200">
                  Your coding journey progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Total Questions */}
                  <div className="text-center space-y-2">
                    <div className="flex justify-center">
                      <div className="h-16 w-16 rounded-full bg-blue-300 flex items-center justify-center">
                        <Target className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-blue-300">
                        {questionsStats.total}
                      </p>
                      <p className="text-sm text-gray-200">Total Solved</p>
                    </div>
                  </div>

                  {/* Easy Questions */}
                  <QuestionStats stats={questionsStats.easy} tag="E" />

                  {/* Medium Questions */}
                  <QuestionStats stats={questionsStats.medium} tag="M" />

                  {/* Hard Questions */}
                  <QuestionStats stats={questionsStats.hard} tag="H" />
                </div>

                <Separator className="my-6" />

                {/* Progress Bars */}
                <div className="space-y-4">
                  <ProgressBar questionsStats={questionsStats} tag="easy" />
                  <ProgressBar questionsStats={questionsStats} tag="medium" />
                  <ProgressBar questionsStats={questionsStats} tag="hard" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
