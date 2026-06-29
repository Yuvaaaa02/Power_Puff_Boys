"use client";

import { Download } from "lucide-react";
import Papa from "papaparse";
import { Expense, Settlement } from "@/lib/types";

interface CSVDownloadButtonProps {
  data?: Expense[];
  settlements?: Settlement[];
  filename: string;
  type: "member" | "admin" | "admin_settlements";
  memberName?: string;
}

export function CSVDownloadButton({ data = [], settlements = [], filename, type, memberName }: CSVDownloadButtonProps) {
  const handleDownload = () => {
    let exportData: any[] = [];

    if (type === "member" && memberName) {
      exportData = data.map((exp) => {
        const isPayer = exp.paidBy === memberName;
        const owes = exp.splitAmong.includes(memberName) && !isPayer;
        
        let myShare = 0;
        if (exp.splitAmong.includes(memberName)) {
          myShare = exp.splitAmount;
        }

        const isSettled = owes && settlements.some(s => 
          s.expenseId === exp.id && s.from === memberName && s.to === exp.paidBy
        );

        const settlementDate = isSettled ? settlements.find(s => 
          s.expenseId === exp.id && s.from === memberName && s.to === exp.paidBy
        )?.date : "-";

        return {
          Date: exp.date,
          Section: exp.section,
          "Description / Items": exp.section === "morning" && exp.items
            ? exp.items.map(i => `${i.name} (₹${i.cost})`).join(", ")
            : exp.description || "-",
          "Total Amount": `₹${exp.totalAmount}`,
          "Split Among": exp.splitAmong.join(", "),
          "My Share": `₹${myShare}`,
          "Paid By": exp.paidBy,
          Status: isPayer ? "I Paid" : owes ? "I Owe" : "Settled/N/A",
          "Settlement Status": isPayer ? "-" : isSettled ? "Paid" : owes ? "Pending" : "-",
          "Paid On": settlementDate
        };
      });
    } else if (type === "admin_settlements") {
      exportData = settlements.map((s) => ({
        Date: s.date,
        From: s.from,
        To: s.to,
        Amount: `₹${s.amount.toFixed(2)}`,
        Note: s.note,
        "Expense Reference": s.expenseId || "-"
      }));
    } else {
      exportData = data.map((exp) => ({
        Date: exp.date,
        Section: exp.section,
        "Description / Items": exp.section === "morning" && exp.items
          ? exp.items.map(i => `${i.name} (₹${i.cost})`).join(", ")
          : exp.description || "-",
        "Total Amount": `₹${exp.totalAmount}`,
        "Split Among": exp.splitAmong.join(", "),
        "Per Person": `₹${exp.splitAmount.toFixed(2)}`,
        "Paid By": exp.paidBy,
      }));
    }

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    link.href = url;
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      onClick={handleDownload}
      className="w-full sm:w-auto flex justify-center items-center space-x-2 px-4 py-2.5 sm:py-2 bg-[#1A1A1A] hover:bg-[#222222] border border-[#333333] text-white rounded-lg transition-colors text-sm font-medium whitespace-nowrap flex-shrink-0"
    >
      <Download size={16} />
      <span>{type === "admin_settlements" ? "Download Settlements (CSV)" : "Download CSV"}</span>
    </button>
  );
}
