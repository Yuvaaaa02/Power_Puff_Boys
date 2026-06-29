"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";
import { CSVDownloadButton } from "@/components/CSVDownloadButton";
import { Expense, Settlement } from "@/lib/types";
import { toast } from "sonner";
import { apiUrl } from "@/lib/apiBase";
import { format, parseISO } from "date-fns";
import { Pencil, Trash2, Eye, EyeOff, Save, X } from "lucide-react";

const MEMBERS = ["Yuvaraj", "Anand", "Varshith", "Mahendra"];

export default function AdminPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [activeTab, setActiveTab] = useState<"overview" | "expenses" | "members">("overview");
  
  // Data State
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [users, setUsers] = useState<any>({});
  const [loading, setLoading] = useState(true);
  
  // Filters for Expenses Tab
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [payerFilter, setPayerFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState(format(new Date(), "yyyy-MM"));
  
  // Edit State
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [passwordEdits, setPasswordEdits] = useState<Record<string, string>>({});
  const [upiEdits, setUpiEdits] = useState<Record<string, string>>({});

  useEffect(() => {
    const session = localStorage.getItem("roomsplit-session");
    if (!session) {
      router.push("/login");
      return;
    }
    const user = JSON.parse(session);
    if (user.role !== "admin") {
      router.push(`/dashboard/${user.name}`);
      return;
    }
    setCurrentUser(user);
    
    fetchData();
  }, [router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const ts = Date.now();
      const [expRes, setRes, userRes] = await Promise.all([
        fetch(apiUrl(`/api/expenses?t=${ts}`)),
        fetch(apiUrl(`/api/settlements?t=${ts}`)),
        fetch(apiUrl(`/api/users?t=${ts}`))
      ]);
      const expData = await expRes.json();
      const setData = await setRes.json();
      const userData = await userRes.json();
      setExpenses(expData);
      setSettlements(setData);
      setUsers(userData);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // OVERVIEW CALCULATIONS
  const allMonths = new Set([
    ...expenses.map(e => e.date.substring(0, 7)),
    ...settlements.map(s => s.month)
  ]);
  const availableMonths = Array.from(allMonths).sort().reverse();
  if (availableMonths.length === 0) availableMonths.push(format(new Date(), "yyyy-MM"));

  const filteredOverviewExpenses = expenses.filter(e => e.date.startsWith(monthFilter));
  const filteredOverviewSettlements = settlements.filter(s => s.month === monthFilter);
  
  const overviewData = MEMBERS.map(member => {
    let paid = 0;
    let owed = 0;
    let settled = 0;

    filteredOverviewExpenses.forEach(exp => {
      if (exp.paidBy === member) paid += exp.totalAmount;
      if (exp.splitAmong.includes(member) && exp.paidBy !== member) owed += exp.splitAmount;
    });

    filteredOverviewSettlements.forEach(s => {
      if (s.from === member) settled += s.amount;
    });

    return { member, paid, owed, settled, net: paid - owed };
  });

  // EXPENSES TAB CALCULATIONS
  let filteredExpenses = expenses;
  if (sectionFilter !== "all") filteredExpenses = filteredExpenses.filter(e => e.section === sectionFilter);
  if (payerFilter !== "all") filteredExpenses = filteredExpenses.filter(e => e.paidBy === payerFilter);

  // ACTIONS
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    try {
      const res = await fetch(apiUrl(`/api/expenses/${id}`), { method: "DELETE" });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || "Failed to delete");
      }
      setExpenses(expenses.filter(e => e.id !== id));
      toast.success("Expense deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete");
      fetchData();
    }
  };

  const handleUpdatePassword = async (name: string) => {
    const newPass = passwordEdits[name];
    if (!newPass || newPass.trim() === "") return toast.error("Password cannot be empty");
    
    try {
      const res = await fetch(apiUrl(`/api/users/${name}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPass })
      });
      if (!res.ok) throw new Error();
      toast.success(`${name}'s password updated`);
      
      setUsers({
        ...users,
        [name]: { ...users[name], password: newPass }
      });
      
      const newEdits = { ...passwordEdits };
      delete newEdits[name];
      setPasswordEdits(newEdits);
    } catch (e) {
      toast.error("Failed to update password");
    }
  };

  const handleUpdateUpi = async (name: string) => {
    const newUpi = upiEdits[name];
    if (!newUpi || !newUpi.includes("@")) return toast.error("Must be a valid UPI ID (e.g. name@bank)");
    
    try {
      const res = await fetch(apiUrl(`/api/users/${name}/upi`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ upiId: newUpi })
      });
      if (!res.ok) throw new Error();
      toast.success(`${name}'s UPI ID updated`);
      
      setUsers({
        ...users,
        [name]: { ...users[name], upiId: newUpi }
      });
      
      const newEdits = { ...upiEdits };
      delete newEdits[name];
      setUpiEdits(newEdits);
    } catch (e) {
      toast.error("Failed to update UPI ID");
    }
  };

  const maskUpi = (upi?: string) => {
    if (!upi) return "Not set";
    const [name, bank] = upi.split("@");
    if (!bank) return upi;
    return `${name}@***`;
  };

  if (!currentUser) return null;

  return (
    <AppLayout>
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-[#C0FF34]">Admin Dashboard</h1>
          <p className="text-[#888888] mt-1">Manage system data, expenses, and users.</p>
        </div>
        
        <div className="flex space-x-2 bg-[#111] p-1 rounded-xl border border-[#222] overflow-x-auto w-full md:w-auto no-scrollbar">
          {(["overview", "expenses", "members"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 md:flex-none px-6 py-2.5 sm:py-2 rounded-lg text-sm font-medium capitalize transition-colors whitespace-nowrap ${
                activeTab === tab 
                  ? "bg-[#C0FF34] text-black shadow-sm" 
                  : "text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-gray-400">Loading data...</div>
      ) : (
        <>
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#111] p-4 rounded-xl border border-[#222] gap-4">
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <span className="text-sm text-gray-400 whitespace-nowrap hidden sm:inline">Select Month:</span>
                  <select 
                    value={monthFilter}
                    onChange={(e) => setMonthFilter(e.target.value)}
                    className="bg-[#1A1A1A] border border-[#333] text-white rounded-lg px-3 py-2 sm:py-1.5 focus:outline-none focus:border-[#C0FF34] w-full sm:w-auto appearance-none"
                  >
                    {availableMonths.map(m => (
                      <option key={m} value={m}>{format(parseISO(m + "-01"), "MMMM yyyy")}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full md:w-auto">
                  <div className="w-full sm:w-auto">
                    <CSVDownloadButton 
                      data={filteredOverviewExpenses} 
                      filename={`RoomSplit_Full_Report_${monthFilter}`} 
                      type="admin" 
                    />
                  </div>
                  <div className="w-full sm:w-auto">
                    <CSVDownloadButton 
                      data={filteredOverviewExpenses} 
                      settlements={filteredOverviewSettlements}
                      filename={`RoomSplit_Settlements_${monthFilter}`} 
                      type="admin_settlements" 
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {overviewData.map(data => (
                  <div key={data.member} className="card p-6 border-t-4 border-t-[#333] hover:border-t-[#C0FF34] transition-colors">
                    <h3 className="text-xl font-bold mb-4">{data.member}</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Paid</span>
                        <span className="font-mono text-[#4ADE80]">₹{data.paid.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Owes</span>
                        <span className="font-mono text-[#F87171]">₹{data.owed.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Settled (Sent)</span>
                        <span className="font-mono text-[#C0FF34]">₹{data.settled.toFixed(2)}</span>
                      </div>
                      <div className="pt-3 border-t border-[#333] flex justify-between font-medium">
                        <span>Net Balance</span>
                        <span className={`font-mono ${data.net >= 0 ? 'text-[#4ADE80]' : 'text-[#F87171]'}`}>
                          {data.net >= 0 ? '+' : '-'}₹{Math.abs(data.net).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent Settlements Table */}
              <div className="card overflow-hidden mt-8">
                <div className="bg-[#111] border-b border-[#222] px-6 py-4">
                  <h3 className="font-bold text-white">Recent Settlements</h3>
                </div>
                {settlements.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">No settlements recorded yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#222] bg-[#0A0A0A]">
                          <th className="py-3 px-4 text-sm font-medium text-[#C0FF34]">Date</th>
                          <th className="py-3 px-4 text-sm font-medium text-[#C0FF34]">From</th>
                          <th className="py-3 px-4 text-sm font-medium text-[#C0FF34]">To</th>
                          <th className="py-3 px-4 text-sm font-medium text-[#C0FF34]">Amount</th>
                          <th className="py-3 px-4 text-sm font-medium text-[#C0FF34]">Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {settlements.slice(0, 10).map((s, idx) => (
                          <tr key={s.id} className={`border-b border-[#222] last:border-0 ${idx % 2 === 0 ? 'bg-[#111]' : 'bg-[#0F0F0F]'}`}>
                            <td className="py-3 px-4 text-sm whitespace-nowrap">{format(parseISO(s.date), "MMM dd, yyyy")}</td>
                            <td className="py-3 px-4 text-sm font-medium text-gray-300">{s.from}</td>
                            <td className="py-3 px-4 text-sm font-medium text-gray-300">{s.to}</td>
                            <td className="py-3 px-4 font-mono text-[#4ADE80]">₹{s.amount.toFixed(2)}</td>
                            <td className="py-3 px-4 text-xs text-gray-400">{s.note}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: EXPENSES */}
          {activeTab === "expenses" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="card p-4 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-4 flex-wrap">
                  <select 
                    value={sectionFilter}
                    onChange={(e) => setSectionFilter(e.target.value)}
                    className="bg-[#1A1A1A] border border-[#333] text-white rounded-lg px-3 py-1.5"
                  >
                    <option value="all">All Sections</option>
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="night">Night</option>
                  </select>

                  <select 
                    value={payerFilter}
                    onChange={(e) => setPayerFilter(e.target.value)}
                    className="bg-[#1A1A1A] border border-[#333] text-white rounded-lg px-3 py-1.5"
                  >
                    <option value="all">All Payers</option>
                    {MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                
                <CSVDownloadButton data={filteredExpenses} filename="RoomSplit_All_Expenses" type="admin" />
              </div>

              <div className="card overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#222] bg-[#0A0A0A]">
                      <th className="py-3 px-4 text-sm font-medium text-[#C0FF34]">Date</th>
                      <th className="py-3 px-4 text-sm font-medium text-[#C0FF34]">Sec</th>
                      <th className="py-3 px-4 text-sm font-medium text-[#C0FF34]">Paid By</th>
                      <th className="py-3 px-4 text-sm font-medium text-[#C0FF34]">Total</th>
                      <th className="py-3 px-4 text-sm font-medium text-[#C0FF34]">Split Among</th>
                      <th className="py-3 px-4 text-sm font-medium text-[#C0FF34] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.map((exp, idx) => (
                      <tr key={exp.id} className={`border-b border-[#222] last:border-0 ${idx % 2 === 0 ? 'bg-[#111]' : 'bg-[#0F0F0F]'}`}>
                        <td className="py-3 px-4 text-sm whitespace-nowrap">{exp.date}</td>
                        <td className="py-3 px-4 text-sm capitalize">{exp.section}</td>
                        <td className="py-3 px-4 text-sm font-medium">{exp.paidBy}</td>
                        <td className="py-3 px-4 font-mono">₹{exp.totalAmount}</td>
                        <td className="py-3 px-4 text-xs">
                          {exp.splitAmong.join(", ")}
                        </td>
                        <td className="py-3 px-4 flex justify-end gap-2">
                          <button onClick={() => handleDelete(exp.id)} className="p-1.5 text-gray-500 hover:text-[#F87171] hover:bg-[#F87171]/10 rounded">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredExpenses.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-500">No expenses found matching filters.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: MEMBERS */}
          {activeTab === "members" && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 animate-in fade-in">
              {MEMBERS.map(member => {
                const user = users[member];
                if (!user) return null;
                
                const showPass = showPasswords[member];
                const editingPass = passwordEdits[member] !== undefined;
                const editingUpi = upiEdits[member] !== undefined;
                
                return (
                  <div key={member} className="card p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#1A1A1A] border border-[#333] flex items-center justify-center text-xl font-display text-[#C0FF34] flex-shrink-0">
                        {member.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{member}</h3>
                        <p className="text-xs text-gray-400 capitalize">Role: {user.role}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
                      
                      {/* UPI ID Section */}
                      <div className="flex items-center gap-2 bg-[#141414] p-2 rounded-lg border border-[#222] w-full sm:w-auto">
                        <span className="text-xs text-gray-500 font-bold ml-1">UPI</span>
                        {editingUpi ? (
                          <div className="flex items-center gap-1">
                            <input 
                              type="text"
                              value={upiEdits[member]}
                              onChange={(e) => setUpiEdits({...upiEdits, [member]: e.target.value})}
                              className="bg-[#1A1A1A] border border-[#C0FF34] text-white px-2 py-1 rounded text-xs w-32 focus:outline-none"
                              placeholder="name@ybl"
                            />
                            <button onClick={() => handleUpdateUpi(member)} className="p-1 text-[#4ADE80] hover:bg-[#4ADE80]/10 rounded">
                              <Save size={14} />
                            </button>
                            <button 
                              onClick={() => {
                                const newEdits = {...upiEdits};
                                delete newEdits[member];
                                setUpiEdits(newEdits);
                              }} 
                              className="p-1 text-gray-400 hover:text-white rounded"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className={`font-mono text-xs w-32 truncate ${!user.upiId ? 'text-gray-500 italic' : 'text-gray-300'}`}>
                              {maskUpi(user.upiId)}
                            </span>
                            <button 
                              onClick={() => setUpiEdits({...upiEdits, [member]: user.upiId || ""})}
                              className="text-gray-400 hover:text-[#C0FF34]"
                              title="Edit UPI ID"
                            >
                              <Pencil size={14} />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Password Section */}
                      <div className="flex items-center gap-2 bg-[#141414] p-2 rounded-lg border border-[#222] w-full sm:w-auto">
                        <span className="text-xs text-gray-500 font-bold ml-1">PWD</span>
                        {editingPass ? (
                          <div className="flex items-center gap-1">
                            <input 
                              type="text"
                              value={passwordEdits[member]}
                              onChange={(e) => setPasswordEdits({...passwordEdits, [member]: e.target.value})}
                              className="bg-[#1A1A1A] border border-[#C0FF34] text-white px-2 py-1 rounded text-xs w-24 focus:outline-none"
                              placeholder="New pass"
                            />
                            <button onClick={() => handleUpdatePassword(member)} className="p-1 text-[#4ADE80] hover:bg-[#4ADE80]/10 rounded">
                              <Save size={14} />
                            </button>
                            <button 
                              onClick={() => {
                                const newEdits = {...passwordEdits};
                                delete newEdits[member];
                                setPasswordEdits(newEdits);
                              }} 
                              className="p-1 text-gray-400 hover:text-white rounded"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-gray-300 w-20">
                              {showPass ? user.password : "••••••••"}
                            </span>
                            <button 
                              onClick={() => setShowPasswords({...showPasswords, [member]: !showPass})}
                              className="text-gray-400 hover:text-[#C0FF34]"
                            >
                              {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                            <div className="w-px h-3 bg-[#333] mx-1"></div>
                            <button 
                              onClick={() => setPasswordEdits({...passwordEdits, [member]: user.password})}
                              className="text-gray-400 hover:text-[#C0FF34]"
                              title="Edit Password"
                            >
                              <Pencil size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                      
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
}
