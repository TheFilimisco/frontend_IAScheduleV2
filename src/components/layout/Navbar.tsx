"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, User, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Navbar({ role = "admin" }: { role?: "admin" | "employee" }) {
  const pathname = usePathname();

  return (
    <>
      <div className="absolute top-5 left-5 bg-[#222222] text-white px-6 py-3 rounded-xl font-bold text-lg shadow-md w-fit flex">
        Company Name
      </div>
      <nav className="fixed bottom-4 left-0 w-full md:static md:w-auto md:bottom-auto flex justify-center items-center py-0 md:py-6 px-8 md:px-10 z-50">
        <div className="bg-[#222222] text-white px-6 py-3 rounded-xl flex items-center gap-6 shadow-md w-full md:w-auto justify-center mx-20 md:mx-0">
          {role === "admin" && (
            <>
              <Link
                href="/admin"
                className={`p-1.5 rounded-md transition-colors ${pathname === '/admin' ? 'bg-white text-black hover:bg-gray-200' : 'text-gray-300 hover:bg-[#333333] hover:text-white'}`}
              >
                <Home size={20} />
              </Link>
              <Link
                href="/admin/management"
                className={`p-1.5 rounded-md transition-colors ${pathname === '/admin/management' ? 'bg-white text-black hover:bg-gray-200' : 'text-gray-300 hover:bg-[#333333] hover:text-white'}`}
              >
                <User size={20} />
              </Link>
              <div className="w-px h-6 bg-gray-500 mx-2"></div>
            </>
          )}
          <Link href="/" className="p-1.5 rounded-md text-gray-300 hover:bg-[#333333] hover:text-white transition-colors">
            <LogOut size={20} />
          </Link>
        </div>
      </nav>
      <div className="absolute top-5 right-5 z-50">
        <ThemeToggle />
      </div>
    </>
  );
}
