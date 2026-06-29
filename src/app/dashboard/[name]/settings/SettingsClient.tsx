"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";
import { toast } from "sonner";
import { Save, User, IndianRupee } from "lucide-react";
import { apiUrl } from "@/lib/apiBase";

export default function SettingsClient({ params }: { params: any }) {
  const router = useRouter();
  const { name } = use(params) as { name: string };
  
  const [upiId, setUpiId] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(apiUrl("/api/users"));
        const data = await res.json();
        if (data[name] && data[name].upiId) {
          setUpiId(data[name].upiId);
        }
      } catch (error) {
        console.error("Failed to fetch user", error);
      } finally {
        setFetching(false);
      }
    };
    fetchUser();
  }, [name]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/users/${name}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ upiId }),
      });
      
      if (!res.ok) {
        throw new Error("Failed to update");
      }
      toast.success("UPI ID updated successfully!");
    } catch (error) {
      toast.error("Failed to update UPI ID.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto mt-8">
        <h1 className="text-3xl font-display font-bold mb-6">Settings</h1>
        
        <div className="card p-6 border border-[#222]">
          <h2 className="text-xl font-medium text-white mb-6 flex items-center gap-2">
            <User size={20} className="text-[#C0FF34]" />
            Profile Settings
          </h2>
          
          {fetching ? (
            <div className="text-gray-400">Loading...</div>
          ) : (
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Your UPI ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IndianRupee size={16} className="text-gray-500" />
                  </div>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="example@upi"
                    className="w-full bg-[#111] border border-[#333] text-white rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-[#C0FF34] transition-colors"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  This will be shown to other members when they need to pay you.
                </p>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-[#C0FF34] text-black px-6 py-2.5 rounded-lg font-medium hover:bg-[#aee62c] transition-colors disabled:opacity-50"
              >
                <Save size={18} />
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </form>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
