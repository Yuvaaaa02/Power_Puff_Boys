"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/users");
      const users = await res.json();

      if (users[username] && users[username].password === password) {
        const role = users[username].role;
        localStorage.setItem(
          "roomsplit-session",
          JSON.stringify({ name: username, role })
        );

        toast.success(`Welcome back, ${username}!`);
        
        if (role === "admin") {
          router.push("/admin");
        } else {
          router.push(`/dashboard/${username}`);
        }
      } else {
        toast.error("Invalid username or password");
      }
    } catch (error) {
      toast.error("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] px-4 font-sans text-white">
      <div className="w-full max-w-md p-8 bg-[#111111] border border-[#222222] rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-3xl font-display font-bold tracking-tight">RoomSplit</h1>
          <p className="text-[#888888] mt-2">Sign in to manage your shared expenses</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#333333] rounded-xl focus:outline-none focus:border-[#C0FF34] focus:ring-1 focus:ring-[#C0FF34] transition-all text-white"
              placeholder="Enter your name or 'admin'"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#333333] rounded-xl focus:outline-none focus:border-[#C0FF34] focus:ring-1 focus:ring-[#C0FF34] transition-all text-white"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#C0FF34] hover:bg-[#aee62c] text-black font-semibold rounded-xl transition-all shadow-[0_0_15px_rgba(192,255,52,0.15)] hover:shadow-[0_0_25px_rgba(192,255,52,0.3)] disabled:opacity-50 flex justify-center"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        
        <div className="mt-8 text-center text-sm text-[#888888]">
          <p>Members: Yuvaraj, Anand, Varshith, Mahendra</p>
        </div>
      </div>
    </div>
  );
}
