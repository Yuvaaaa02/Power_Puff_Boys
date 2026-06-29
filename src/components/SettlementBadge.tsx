import { CheckCircle2 } from "lucide-react";

export function SettlementBadge() {
  return (
    <div className="inline-flex items-center space-x-1 px-2.5 py-1 bg-[#4ADE80]/10 text-[#4ADE80] border border-[#4ADE80]/30 rounded-lg text-xs font-medium">
      <CheckCircle2 size={14} />
      <span>Paid</span>
    </div>
  );
}
