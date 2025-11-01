import { Code2 } from "lucide-react";
import Link from "next/link";
import React from "react";

function Footer() {
  return (
    <footer className="border-t border-blue-800/30 bg-slate-900/50 backdrop-blur-sm w-full">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between space-y-4 sm:flex-row sm:space-y-0">
          <div className="flex items-center">
            <Code2 className="h-6 w-6 text-blue-400" />
            <span className="ml-2 text-lg font-semibold text-white">
              CodeCollab
            </span>
          </div>
          <div className="flex space-x-6">
            <Link
              href="/privacy"
              className="text-blue-200 hover:text-white transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-blue-200 hover:text-white transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/support"
              className="text-blue-200 hover:text-white transition-colors"
            >
              Support
            </Link>
          </div>
        </div>
        <div className="mt-8 text-center text-blue-300">
          <p>&copy; 2025 CodeCollab. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
