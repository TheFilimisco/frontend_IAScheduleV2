"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Fake login logic for now based on role
    if (email.includes("admin")) {
      router.push("/admin");
    } else {
      router.push("/employee");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#dfdfdf]">
      <div className="bg-[#222222] p-10 rounded-xl shadow-2xl w-[400px] flex flex-col items-center">
        <h1 className="text-white text-2xl font-bold mb-8">Company Name</h1>

        <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
          <Input
            type="text"
            placeholder="Email"
            className="bg-white text-black border-none rounded-full h-12 px-6 focus-visible:ring-0"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Password"
            className="bg-white text-black border-none rounded-full h-12 px-6 focus-visible:ring-0"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button
            type="submit"
            className="bg-white text-black hover:bg-gray-200 rounded-full h-12 mt-4 font-semibold text-lg"
          >
            Enter
          </Button>
        </form>
      </div>
    </div>
  );
}
