import Link from "next/link";
import { Home, User, LogOut } from "lucide-react";

export function Navbar({ role = "admin" }: { role?: "admin" | "employee" }) {
  return (
    <nav className="flex justify-between items-center py-6 px-10">
      <div className="bg-[#222222] text-white px-6 py-3 rounded-xl font-bold text-lg shadow-md">
        Company Name
      </div>

      <div className="bg-[#222222] text-white px-6 py-3 rounded-xl flex items-center gap-6 shadow-md">
        {role === "admin" && (
          <>
            <Link href="/admin" className="hover:text-gray-300 bg-white text-black rounded-md p-1">
              <Home size={20} />
            </Link>
            <Link href="/admin/management" className="hover:text-gray-300">
              <User size={20} />
            </Link>
            <div className="w-px h-6 bg-gray-500 mx-2"></div>
          </>
        )}
        <Link href="/" className="hover:text-gray-300">
          <LogOut size={20} />
        </Link>
      </div>
    </nav>
  );
}
