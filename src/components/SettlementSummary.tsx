"use client";

import { Expense, Settlement, UsersData } from "@/lib/types";
import { PayButton } from "./PayButton";
import { CheckCircle2, ClipboardCopy, Send } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

interface SettlementSummaryProps {
  currentUserName: string;
  currentMonth: string;
  expenses: Expense[];
  settlements: Settlement[];
  users: UsersData;
  onSettled: () => void;
}

export function SettlementSummary({ currentUserName, currentMonth, expenses, settlements, users, onSettled }: SettlementSummaryProps) {
  const youOwe: Record<string, number> = {};
  const theyOwe: Record<string, number> = {};

  // Calculate base from expenses
  expenses.forEach(exp => {
    // Only care about current month (assuming expenses passed are already filtered or we filter here)
    if (!exp.date.startsWith(currentMonth)) return;

    if (exp.splitAmong.includes(currentUserName) && exp.paidBy !== currentUserName) {
      youOwe[exp.paidBy] = (youOwe[exp.paidBy] || 0) + exp.splitAmount;
    }

    if (exp.paidBy === currentUserName) {
      exp.splitAmong.forEach(member => {
        if (member !== currentUserName) {
          theyOwe[member] = (theyOwe[member] || 0) + exp.splitAmount;
        }
      });
    }
  });

  // Subtract settled amounts
  settlements.forEach(s => {
    if (s.month !== currentMonth) return;

    if (s.from === currentUserName) {
      if (youOwe[s.to] !== undefined) {
        youOwe[s.to] -= s.amount;
      }
    }

    if (s.to === currentUserName) {
      if (theyOwe[s.from] !== undefined) {
        theyOwe[s.from] -= s.amount;
      }
    }
  });

  // Filter out those less than 1 rupee (basically 0)
  const youOweEntries = Object.entries(youOwe).filter(([_, amt]) => amt > 0.01);
  const theyOweEntries = Object.entries(theyOwe).filter(([_, amt]) => amt > 0.01);
  
  // Get all unique members involved in this month's transactions
  const allInvolvedMembers = Array.from(new Set([
    ...Object.keys(youOwe),
    ...Object.keys(theyOwe)
  ]));

  // Re-build display arrays so we show "Settled" for those who owe 0 but were involved
  const youOweDisplay = Object.keys(youOwe).map(member => ({
    member,
    amount: youOwe[member] > 0.01 ? youOwe[member] : 0
  })).filter(x => x.amount > 0 || (youOwe[x.member] !== undefined && youOwe[x.member] <= 0.01 && youOweEntries.length === 0 /* show settled only if nothing pending? Or show settled for everyone? Spec says show ✅ Settled */));
  
  // Actually, a simpler way is to just map all involved members
  const displayYouOwe = allInvolvedMembers.filter(m => (youOwe[m] !== undefined && (youOwe[m] > 0.01 || youOwe[m] <= 0.01 && (youOwe[m] + (settlements.filter(s => s.to === m && s.from === currentUserName).reduce((acc, s)=>acc+s.amount, 0)) > 0.01)))); 
  // Wait, the spec shows a simple list. I will just show members who you owe, and if it's <= 0, show Settled.
  
  const formattedYouOwe = Object.keys(youOwe).map(member => ({
    name: member,
    amount: youOwe[member] > 0.01 ? youOwe[member] : 0
  }));

  const formattedTheyOwe = Object.keys(theyOwe).map(member => ({
    name: member,
    amount: theyOwe[member] > 0.01 ? theyOwe[member] : 0
  }));

  const allSettled = formattedYouOwe.every(m => m.amount === 0) && formattedTheyOwe.every(m => m.amount === 0);
  const noActivity = formattedYouOwe.length === 0 && formattedTheyOwe.length === 0;

  const copyMyUpi = () => {
    const myUpi = users[currentUserName]?.upiId;
    if (myUpi) {
      navigator.clipboard.writeText(myUpi);
      toast.success("Your UPI ID copied to clipboard!");
    } else {
      toast.error("You don't have a UPI ID set.");
    }
  };

  return (
    <div className="card mb-8 overflow-hidden border border-[#222]">
      <div className="bg-[#111] border-b border-[#222] px-6 py-4 flex items-center gap-3">
        <Send className="text-[#C0FF34]" size={20} />
        <h2 className="font-display font-bold text-lg text-white">Settlement Summary — {format(parseISO(currentMonth + "-01"), "MMMM yyyy")}</h2>
      </div>

      <div className="p-6">
        {noActivity ? (
          <p className="text-gray-500 text-sm">No split expenses for this month.</p>
        ) : allSettled ? (
          <div className="flex items-center gap-3 bg-[#4ADE80]/10 border border-[#4ADE80]/20 p-4 rounded-xl text-[#4ADE80]">
            <CheckCircle2 size={24} />
            <span className="font-medium">You're all settled up this month!</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* YOU OWE */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">You Owe</h3>
              <div className="space-y-3">
                {formattedYouOwe.length === 0 && <p className="text-sm text-gray-500">Nothing pending.</p>}
                {formattedYouOwe.map(m => (
                  <div key={m.name} className="flex items-center justify-between bg-[#1A1A1A] border border-[#333] p-3 rounded-xl">
                    <span className="font-medium text-white">{m.name}</span>
                    {m.amount > 0 ? (
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-sm text-[#F87171]">₹{m.amount.toFixed(2)} pending</span>
                        <PayButton 
                          upiId={users[m.name]?.upiId} 
                          receiverName={m.name} 
                          amount={m.amount} 
                          note={`RoomSplit - ${format(parseISO(currentMonth + "-01"), "MMMM")} settlement`} 
                          fromName={currentUserName} 
                          onSettled={onSettled} 
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[#4ADE80] text-sm font-medium">
                        <CheckCircle2 size={16} />
                        <span>Settled</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* THEY OWE YOU */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">They Owe You</h3>
              <div className="space-y-3">
                {formattedTheyOwe.length === 0 && <p className="text-sm text-gray-500">Nothing pending.</p>}
                {formattedTheyOwe.map(m => (
                  <div key={m.name} className="flex items-center justify-between bg-[#1A1A1A] border border-[#333] p-3 rounded-xl">
                    <span className="font-medium text-white">{m.name}</span>
                    {m.amount > 0 ? (
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-sm text-[#4ADE80]">₹{m.amount.toFixed(2)} pending</span>
                        <button 
                          onClick={copyMyUpi}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#222] hover:bg-[#333] border border-[#333] text-gray-300 hover:text-white rounded-lg text-xs font-medium transition-colors"
                        >
                          <ClipboardCopy size={14} />
                          <span>Copy UPI</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[#4ADE80] text-sm font-medium">
                        <CheckCircle2 size={16} />
                        <span>Settled</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}
