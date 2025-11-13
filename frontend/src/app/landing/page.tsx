/*
AI Assistance Disclosure:
Tool: Gemini 2.5 Flash, date: 2025-09-16
Scope: Helped debug issues discovered during testing, then updated the code to fix them.
Author review: I verified correctness of the modifications by AI against requirements. I fixed minor issues, improved clarity, and ran checks to confirm the UI works as expected.
*/
"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Code2, Users, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { SignInForm } from "./_components/signin-form";
import { SignUpForm } from "./_components/signup-form";
import Footer from "../_components/Footer";
import SoloPracticeButton from "../_components/SoloPracticeButton";

export default function LandingPage() {
  const [displaySignUp, setDisplaySignUp] = useState(false);
  const [displayLogin, setDisplayLogin] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Navigation */}
      <nav className="border-b border-blue-800/30 bg-slate-900/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Code2 className="h-8 w-8 text-blue-400" />
              <span className="ml-2 text-xl font-bold text-white">
                CodeCollab
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                className="text-blue-200 hover:text-white hover:bg-blue-800/30"
                onClick={() => setDisplayLogin(true)}
              >
                Sign In
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => setDisplaySignUp(true)}
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="mb-6 text-5xl font-bold leading-tight text-white sm:text-6xl lg:text-7xl">
            Code Together,
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              {" "}
              Learn Better
            </span>
          </h1>
          <p className="mb-8 text-xl text-blue-200 sm:text-2xl">
            The ultimate platform for real-time code collaboration.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
              onClick={() => setDisplaySignUp(true)}
            >
              Start Collaborating
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Everything you need for Peer Coding
            </h2>
            <p className="text-xl text-blue-200 max-w-2xl mx-auto">
              Powerful features designed to make collaborative coding seamless
              and productive.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="bg-slate-800/50 border-blue-800/30 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <div className="rounded-full bg-blue-600/20 p-2">
                    <Users className="h-6 w-6 text-blue-400" />
                  </div>
                  <CardTitle className="text-white">
                    Real-time Collaboration
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-blue-200">
                  Work together in real-time with live cursors, instant sync,
                  and seamless conflict resolution.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-blue-800/30 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <div className="rounded-full bg-blue-600/20 p-2">
                    <Code2 className="h-6 w-6 text-blue-400" />
                  </div>
                  <CardTitle className="text-white">
                    Smart Code Editor
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-blue-200">
                  Powerful editor with syntax highlighting, auto-completion, and
                  intelligent code analysis.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-blue-800/30 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <div className="rounded-full bg-blue-600/20 p-2">
                    <MessageSquare className="h-6 w-6 text-blue-400" />
                  </div>
                  <CardTitle className="text-white">
                    Built-in Communication
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-blue-200">
                  Chat integrated directly into your coding environment.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      <Dialog open={displayLogin} onOpenChange={setDisplayLogin}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold">
              Welcome Back
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <SignInForm />
          </div>
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don&apos;t have an account?{" "}
              <Button
                variant="link"
                className="p-0 h-auto text-blue-600 hover:text-blue-700 cursor-pointer"
                onClick={() => {
                  setDisplayLogin(false);
                  setDisplaySignUp(true);
                }}
              >
                Sign up
              </Button>
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sign Up Modal */}
      <Dialog open={displaySignUp} onOpenChange={setDisplaySignUp}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold">
              Create Your Account
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <SignUpForm />
          </div>
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <Button
                variant="link"
                className="p-0 h-auto text-blue-600 hover:text-blue-700 cursor-pointer"
                onClick={() => {
                  setDisplaySignUp(false);
                  setDisplayLogin(true);
                }}
              >
                Sign in
              </Button>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
