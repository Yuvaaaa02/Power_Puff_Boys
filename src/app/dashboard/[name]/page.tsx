"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";
import { CSVDownloadButton } from "@/components/CSVDownloadButton";
import { Expense, Settlement, UsersData } from "@/lib/types";
import { SettlementSummary } from "@/components/SettlementSummary";
import { PayButton } from "@/components/PayButton";
import { SettlementBadge } from "@/components/SettlementBadge";
import { ArrowRight, IndianRupee, PieChart, Receipt, Wallet, PlusCircle } from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";

export default function DashboardPage({ params }: { params: Promise<{ name: string }> }) {
  const router = useRouter();
  const { name } = use(params);
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [users, setUsers] = useState<UsersData>({});
  const [loading, setLoading] = useState(true);
  
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), "yyyy-MM"));
  const [availableMonths, setAvailableMonths] = useState<string[]>([format(new Date(), "yyyy-MM")]);
  
  const [activeTab, setActiveTab] = useState<"morning" | "afternoon" | "night">("morning");

  useEffect(() => {
    // Auth check
    const session = localStorage.getItem("roomsplit-session");
    if (!session) {
      router.push("/login");
      return;
    }
    const user = JSON.parse(session);
    if (user.name !== name && user.role !== "admin") {
      router.push(`/dashboard/${user.name}`);
      return;
    }

    fetchData(currentMonth);
  }, [name, currentMonth, router]);

  const fetchData = async (month: string) => {
    try {
      setLoading(true);
      const [expRes, setRes, usrRes] = await Promise.all([
        fetch(`/api/expenses?month=${month}`),
        fetch(`/api/settlements?month=${month}`),
        fetch("/api/users")
      ]);
      const expData = await expRes.json();
      const setData = await setRes.json();
      const usrData = await usrRes.json();
      
      setExpenses(expData);
      setSettlements(setData);
      setUsers(usrData);

      // We should also fetch available months based on expenses and settlements
      const allExpRes = await fetch("/api/expenses");
      const allExpData: Expense[] = await allExpRes.json();
      const allSetRes = await fetch("/api/settlements");
      const allSetData: Settlement[] = await allSetRes.json();
      
      const allMonths = new Set([
        ...allExpData.map(e => e.date.substring(0, 7)),
        ...allSetData.map(s => s.month)
      ]);
      
      const sortedMonths = Array.from(allMonths).sort().reverse();
      if (sortedMonths.length > 0) {
        setAvailableMonths(sortedMonths);
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshSettlements = () => {
    fetchData(currentMonth);
  };

  // Calculations for current month summary cards
  let totalSpent = 0;
  let totalOwed = 0;
  
  expenses.forEach(exp => {
    if (exp.paidBy === name) {
      totalSpent += exp.totalAmount;
    }
    if (exp.splitAmong.includes(name) && exp.paidBy !== name) {
      totalOwed += exp.splitAmount;
    }
  });

  const netBalance = totalSpent - totalOwed;
  const isNetPositive = netBalance >= 0;

  const sectionExpenses = expenses.filter(exp => exp.section === activeTab);

  return (
    <AppLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Hello, {name}</h1>
          <p className="text-[#888888] mt-1">Here is your summary for {format(parseISO(currentMonth + "-01"), "MMMM yyyy")}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
          <select 
            value={currentMonth}
            onChange={(e) => setCurrentMonth(e.target.value)}
            className="bg-[#111] border border-[#222] text-white rounded-lg px-4 py-2.5 sm:py-2 focus:outline-none focus:border-[#C0FF34] w-full sm:w-auto appearance-none"
          >
            {availableMonths.map(m => (
              <option key={m} value={m}>{format(parseISO(m + "-01"), "MMM yyyy")}</option>
            ))}
          </select>

          <Link href="/add-expense" className="flex-shrink-0 w-full sm:w-auto">
            <button className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 sm:py-2 bg-[#C0FF34] text-black rounded-lg font-medium hover:bg-[#aee62c] transition-colors">
              <PlusCircle size={18} />
              <span>Add Expense</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-6 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20 text-[#C0FF34]">
            <Wallet size={48} />
          </div>
          <p className="text-sm text-[#888] font-medium mb-1">Total Spent</p>
          <p className="text-3xl font-mono font-semibold">₹{totalSpent.toFixed(2)}</p>
        </div>

        <div className="card p-6 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20 text-[#F87171]">
            <Receipt size={48} />
          </div>
          <p className="text-sm text-[#888] font-medium mb-1">Total Owed</p>
          <p className="text-3xl font-mono font-semibold text-[#F87171]">₹{totalOwed.toFixed(2)}</p>
        </div>

        <div className={`card p-6 flex flex-col relative overflow-hidden border-l-4 ${isNetPositive ? 'border-l-[#4ADE80]' : 'border-l-[#F87171]'}`}>
          <div className={`absolute top-0 right-0 p-4 opacity-20 ${isNetPositive ? 'text-[#4ADE80]' : 'text-[#F87171]'}`}>
            <PieChart size={48} />
          </div>
          <p className="text-sm text-[#888] font-medium mb-1">Net Balance</p>
          <p className={`text-3xl font-mono font-semibold ${isNetPositive ? 'text-[#4ADE80]' : 'text-[#F87171]'}`}>
            {isNetPositive ? '+' : '-'}₹{Math.abs(netBalance).toFixed(2)}
          </p>
        </div>

        <div className="card p-6 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-white">
            <IndianRupee size={48} />
          </div>
          <p className="text-sm text-[#888] font-medium mb-1">Total Entries</p>
          <p className="text-3xl font-mono font-semibold">{expenses.length}</p>
        </div>
      </div>

      {/* Settlement Summary Card */}
      {!loading && (
        <SettlementSummary 
          currentUserName={name}
          currentMonth={currentMonth}
          expenses={expenses}
          settlements={settlements}
          users={users}
          onSettled={handleRefreshSettlements}
        />
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        {/* Tabs */}
        <div className="flex space-x-1 bg-[#111] p-1 rounded-xl border border-[#222] w-full sm:w-auto overflow-x-auto no-scrollbar">
          {(["morning", "afternoon", "night"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 sm:flex-none px-4 py-2.5 sm:py-2 rounded-lg text-sm font-medium capitalize transition-colors whitespace-nowrap ${
                activeTab === tab 
                  ? "bg-[#222] text-[#C0FF34] shadow-sm" 
                  : "text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        
        <div className="w-full sm:w-auto flex">
          <CSVDownloadButton 
            data={expenses} 
            settlements={settlements}
            filename={`RoomSplit_${name}_${currentMonth}`} 
            type="member" 
            memberName={name} 
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-[#888]">Loading expenses...</div>
        ) : sectionExpenses.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-[#1A1A1A] flex items-center justify-center mb-4 text-[#444]">
              <Receipt size={32} />
            </div>
            <p className="text-gray-400 font-medium">No expenses found for {activeTab}</p>
            <p className="text-sm text-[#666] mt-1">Add a new expense to see it here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#222] bg-[#0A0A0A]">
                  <th className="py-4 px-6 text-sm font-medium text-[#C0FF34]">Date</th>
                  <th className="py-4 px-6 text-sm font-medium text-[#C0FF34]">Description / Items</th>
                  <th className="py-4 px-6 text-sm font-medium text-[#C0FF34]">Total</th>
                  <th className="py-4 px-6 text-sm font-medium text-[#C0FF34]">Split Among</th>
                  <th className="py-4 px-6 text-sm font-medium text-[#C0FF34]">Your Share</th>
                  <th className="py-4 px-6 text-sm font-medium text-[#C0FF34]">Paid By</th>
                  <th className="py-4 px-6 text-sm font-medium text-[#C0FF34]">Action</th>
                </tr>
              </thead>
              <tbody>
                {sectionExpenses.map((exp, idx) => {
                  const isPayer = exp.paidBy === name;
                  const owes = exp.splitAmong.includes(name) && !isPayer;
                  const share = exp.splitAmong.includes(name) ? exp.splitAmount : 0;
                  
                  // Check if settled
                  const isSettled = owes && settlements.some(s => 
                    s.expenseId === exp.id && s.from === name && s.to === exp.paidBy
                  );
                  
                  return (
                    <tr 
                      key={exp.id} 
                      className={`border-b border-[#222] last:border-0 hover:bg-[#1A1A1A] transition-colors ${idx % 2 === 0 ? 'bg-[#111]' : 'bg-[#0F0F0F]'} ${
                        isPayer ? 'border-l-2 border-l-[#4ADE80]' : owes ? 'border-l-2 border-l-[#F87171]' : 'border-l-2 border-l-transparent'
                      }`}
                    >
                      <td className="py-4 px-6 text-sm whitespace-nowrap">{format(parseISO(exp.date), "MMM dd")}</td>
                      <td className="py-4 px-6 text-sm">
                        {exp.section === "morning" && exp.items ? (
                          <div className="flex flex-col gap-1">
                            {exp.items.map((item, i) => (
                              <span key={i} className="text-gray-300">
                                {item.name} <span className="text-[#666] text-xs">(₹{item.cost})</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-300">{exp.description || "-"}</span>
                        )}
                      </td>
                      <td className="py-4 px-6 font-mono">₹{exp.totalAmount}</td>
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-1">
                          {exp.splitAmong.map(member => (
                            <span 
                              key={member} 
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                member === name ? 'bg-[#C0FF34]/20 text-[#C0FF34]' : 'bg-[#222] text-gray-400'
                              }`}
                            >
                              {member}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className={`py-4 px-6 font-mono font-medium ${owes ? 'text-[#F87171]' : share === 0 ? 'text-[#555]' : 'text-gray-300'}`}>
                        {share > 0 ? `₹${share.toFixed(2)}` : "-"}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          isPayer ? 'bg-[#4ADE80]/20 text-[#4ADE80]' : 'bg-[#222] text-gray-300'
                        }`}>
                          {exp.paidBy}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {owes && !isSettled && (
                          <PayButton 
                            upiId={users[exp.paidBy]?.upiId}
                            receiverName={exp.paidBy}
                            amount={share}
                            note={`RoomSplit - ${exp.section} expense`}
                            fromName={name}
                            expenseId={exp.id}
                            onSettled={handleRefreshSettlements}
                          />
                        )}
                        {owes && isSettled && <SettlementBadge />}
                        {!owes && <span className="text-[#555]">-</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
