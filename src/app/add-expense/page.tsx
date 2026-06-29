"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";
import { Section, ExpenseItem } from "@/lib/types";
import { toast } from "sonner";
import { format } from "date-fns";
import { Plus, Trash2, CheckCircle2 } from "lucide-react";

const MEMBERS = ["Yuvaraj", "Anand", "Varshith", "Mahendra"];

export default function AddExpensePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const session = localStorage.getItem("roomsplit-session");
    if (!session) {
      router.push("/login");
    } else {
      setCurrentUser(JSON.parse(session));
    }
  }, [router]);

  const [step, setStep] = useState<1 | 2>(1);
  const [section, setSection] = useState<Section | "">("");
  
  // Form State
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [paidBy, setPaidBy] = useState("");
  const [items, setItems] = useState<ExpenseItem[]>([{ name: "", cost: 0 }]);
  const [totalAmount, setTotalAmount] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [splitAmong, setSplitAmong] = useState<string[]>(MEMBERS);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSectionSelect = (s: Section) => {
    setSection(s);
    setStep(2);
  };

  const handleAddItem = () => {
    setItems([...items, { name: "", cost: 0 }]);
  };

  const handleRemoveItem = (idx: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== idx));
    }
  };

  const handleItemChange = (idx: number, field: keyof ExpenseItem, value: string | number) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], [field]: value };
    setItems(newItems);
  };

  const toggleSplitMember = (member: string) => {
    if (splitAmong.includes(member)) {
      setSplitAmong(splitAmong.filter(m => m !== member));
    } else {
      setSplitAmong([...splitAmong, member]);
    }
  };

  // Calculations
  const calculatedTotal = section === "morning" 
    ? items.reduce((sum, item) => sum + (Number(item.cost) || 0), 0)
    : Number(totalAmount) || 0;

  const splitPreview = splitAmong.length > 0 
    ? (calculatedTotal / splitAmong.length).toFixed(2)
    : "0.00";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (!paidBy) return toast.error("Please select who paid");
    if (calculatedTotal <= 0) return toast.error("Total amount must be greater than 0");
    if (splitAmong.length === 0) return toast.error("Must split among at least 1 person");
    
    if (section === "morning") {
      const invalidItems = items.some(i => !i.name.trim() || Number(i.cost) <= 0);
      if (invalidItems) return toast.error("All items must have a name and cost > 0");
    }

    setIsSubmitting(true);
    
    try {
      const payload = {
        date,
        section,
        paidBy,
        totalAmount: calculatedTotal,
        splitAmong,
        splitAmount: calculatedTotal / splitAmong.length,
        ...(section === "morning" ? { items } : { description: description.trim() })
      };

      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to save");

      toast.success("Expense added successfully");
      
      // Reset or redirect
      if (currentUser?.role === "admin") {
        router.push("/admin");
      } else {
        router.push(`/dashboard/${currentUser?.name}`);
      }
      
    } catch (error) {
      toast.error("Failed to add expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) return null;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold">Add New Expense</h1>
          <p className="text-[#888888] mt-1">
            {step === 1 ? "Select the time of day for this expense." : `Fill in details for ${section} expense.`}
          </p>
        </div>

        {step === 1 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button 
              onClick={() => handleSectionSelect("morning")}
              className="card p-8 flex flex-col items-center justify-center text-center hover:bg-[#1a1a1a] hover:border-[#FBBF24] transition-all group"
            >
              <div className="w-16 h-16 rounded-full bg-amber-500/10 text-[#FBBF24] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
              </div>
              <h3 className="text-xl font-bold mb-1">Morning</h3>
              <p className="text-sm text-gray-400">Tiffins & Breakfast</p>
            </button>

            <button 
              onClick={() => handleSectionSelect("afternoon")}
              className="card p-8 flex flex-col items-center justify-center text-center hover:bg-[#1a1a1a] hover:border-[#38bdf8] transition-all group"
            >
              <div className="w-16 h-16 rounded-full bg-sky-500/10 text-[#38bdf8] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M2 12h2"/><path d="M20 12h2"/></svg>
              </div>
              <h3 className="text-xl font-bold mb-1">Afternoon</h3>
              <p className="text-sm text-gray-400">Lunch, Curries, Meals</p>
            </button>

            <button 
              onClick={() => handleSectionSelect("night")}
              className="card p-8 flex flex-col items-center justify-center text-center hover:bg-[#1a1a1a] hover:border-[#a78bfa] transition-all group"
            >
              <div className="w-16 h-16 rounded-full bg-violet-500/10 text-[#a78bfa] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
              </div>
              <h3 className="text-xl font-bold mb-1">Night</h3>
              <p className="text-sm text-gray-400">Dinner & Snacks</p>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between items-center mb-6">
              <button 
                type="button"
                onClick={() => setStep(1)}
                className="text-sm text-gray-400 hover:text-white transition-colors flex items-center"
              >
                ← Back to sections
              </button>
              <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                section === 'morning' ? 'badge-morning' : 
                section === 'afternoon' ? 'badge-afternoon' : 'badge-night'
              }`}>
                {section}
              </div>
            </div>

            <div className="card p-6 md:p-8 space-y-8">
              {/* Row 1: Date & Payer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#333] rounded-xl focus:outline-none focus:border-[#C0FF34] text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Who Paid?</label>
                  <select
                    value={paidBy}
                    onChange={(e) => setPaidBy(e.target.value)}
                    className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#333] rounded-xl focus:outline-none focus:border-[#C0FF34] text-white appearance-none"
                    required
                  >
                    <option value="" disabled>Select member...</option>
                    {MEMBERS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic Items or Single Total */}
              <div className="pt-6 border-t border-[#222]">
                {section === "morning" ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-end mb-2">
                      <label className="block text-sm font-medium text-gray-300">Items</label>
                    </div>
                    
                    {items.map((item, idx) => (
                      <div key={idx} className="flex gap-4 items-start">
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Item Name (e.g. Idli)"
                            value={item.name}
                            onChange={(e) => handleItemChange(idx, "name", e.target.value)}
                            className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#333] rounded-xl focus:outline-none focus:border-[#C0FF34] text-white"
                            required
                          />
                        </div>
                        <div className="w-32 relative">
                          <span className="absolute left-4 top-3 text-gray-500">₹</span>
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={item.cost || ""}
                            onChange={(e) => handleItemChange(idx, "cost", Number(e.target.value))}
                            className="w-full pl-8 pr-4 py-3 bg-[#1A1A1A] border border-[#333] rounded-xl focus:outline-none focus:border-[#C0FF34] text-white font-mono"
                            required
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={items.length === 1}
                          className="p-3 text-gray-500 hover:text-[#F87171] hover:bg-[#F87171]/10 rounded-xl transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-gray-500"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="flex items-center space-x-2 text-sm text-[#C0FF34] hover:text-[#aee62c] font-medium py-2"
                    >
                      <Plus size={16} />
                      <span>Add another item</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Total Amount</label>
                      <div className="relative">
                        <span className="absolute left-4 top-3 text-gray-500 text-lg">₹</span>
                        <input
                          type="number"
                          min="1"
                          placeholder="0.00"
                          value={totalAmount}
                          onChange={(e) => setTotalAmount(Number(e.target.value))}
                          className="w-full pl-10 pr-4 py-3 bg-[#1A1A1A] border border-[#333] rounded-xl focus:outline-none focus:border-[#C0FF34] text-white font-mono text-lg"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Description (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Sambar + Dal"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#333] rounded-xl focus:outline-none focus:border-[#C0FF34] text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Split Among */}
              <div className="pt-6 border-t border-[#222]">
                <label className="block text-sm font-medium text-gray-300 mb-4">
                  {section === "morning" ? "Split Among (Who was present?)" : "Who was present?"}
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {MEMBERS.map(member => {
                    const isSelected = splitAmong.includes(member);
                    return (
                      <div 
                        key={member}
                        onClick={() => toggleSplitMember(member)}
                        className={`cursor-pointer p-4 rounded-xl border transition-all flex items-center justify-between ${
                          isSelected 
                            ? "bg-[#C0FF34]/10 border-[#C0FF34] text-white" 
                            : "bg-[#1A1A1A] border-[#333] text-gray-400 hover:border-gray-500"
                        }`}
                      >
                        <span className="font-medium">{member}</span>
                        {isSelected && <CheckCircle2 size={18} className="text-[#C0FF34]" />}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Live Preview & Submit */}
              <div className="bg-[#1A1A1A] rounded-xl p-6 border border-[#333] flex flex-col md:flex-row justify-between items-center gap-6 mt-8">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Total Bill: <span className="text-white font-mono font-medium">₹{calculatedTotal.toFixed(2)}</span></p>
                  <p className="text-lg text-white">
                    Each person owes: <span className="font-mono font-bold text-[#C0FF34]">₹{splitPreview}</span>
                  </p>
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full md:w-auto px-8 py-3.5 bg-[#C0FF34] hover:bg-[#aee62c] text-black font-semibold rounded-xl transition-all shadow-[0_0_15px_rgba(192,255,52,0.15)] disabled:opacity-50 flex items-center justify-center"
                >
                  {isSubmitting ? "Saving..." : "Save Expense"}
                </button>
              </div>

            </div>
          </form>
        )}
      </div>
    </AppLayout>
  );
}
