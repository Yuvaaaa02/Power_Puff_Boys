"use client";

import { useState, useEffect } from "react";
import { Copy, Smartphone, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface PayButtonProps {
  upiId?: string;
  receiverName: string;
  amount: number;
  note: string;
  fromName: string;
  expenseId?: string;
  onSettled: () => void;
}

export function PayButton({ upiId, receiverName, amount, note, fromName, expenseId, onSettled }: PayButtonProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [showDesktopPopover, setShowDesktopPopover] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsMobile(/Android|iPhone|iPad/i.test(navigator.userAgent));
  }, []);

  const buildUpiUrl = (id: string, name: string, amt: number, note: string) => {
    return `upi://pay?pa=${id}&pn=${encodeURIComponent(name)}&am=${amt.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`;
  };

  const handlePayClick = () => {
    if (!upiId) return;

    if (isMobile) {
      const upiUrl = buildUpiUrl(upiId, receiverName, amount, note);
      
      // Navigate to deep link
      window.location.href = upiUrl;

      // Check if user came back after 2 seconds
      setTimeout(() => {
        if (!document.hidden) {
          toast.error("No UPI app found. Install PhonePe or GPay to continue.");
        } else {
          // They switched apps, so we'll show confirmation when they return
          const onVisibilityChange = () => {
            if (!document.hidden) {
              setShowConfirmModal(true);
              document.removeEventListener("visibilitychange", onVisibilityChange);
            }
          };
          document.addEventListener("visibilitychange", onVisibilityChange);
          
          // Fallback if visibility API acts up
          setTimeout(() => {
            setShowConfirmModal(true);
            document.removeEventListener("visibilitychange", onVisibilityChange);
          }, 3000);
        }
      }, 500);

    } else {
      setShowDesktopPopover(!showDesktopPopover);
    }
  };

  const copyUpiId = () => {
    if (upiId) {
      navigator.clipboard.writeText(upiId);
      toast.success("UPI ID copied to clipboard!");
    }
  };

  const handleMarkAsPaid = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        from: fromName,
        to: receiverName,
        amount,
        note,
        expenseId
      };

      const res = await fetch("/api/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to record settlement");
      
      toast.success(`Successfully recorded payment to ${receiverName}`);
      setShowConfirmModal(false);
      setShowDesktopPopover(false);
      onSettled();
    } catch (error) {
      toast.error("Failed to mark as paid");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!upiId || upiId.trim() === "") {
    return (
      <div className="relative group inline-block">
        <button 
          disabled 
          className="flex items-center space-x-1 px-3 py-1.5 bg-[#222] text-[#555] rounded-lg text-xs font-medium cursor-not-allowed border border-[#333]"
        >
          <AlertCircle size={14} />
          <span>UPI not set</span>
        </button>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-[#111] text-xs text-gray-300 border border-[#333] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Ask admin to set UPI ID
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative inline-block">
        <button
          onClick={handlePayClick}
          className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
            isMobile
              ? "bg-[#C0FF34] text-black hover:bg-[#aee62c]"
              : "bg-transparent border border-[#C0FF34] text-[#C0FF34] hover:bg-[#C0FF34]/10"
          }`}
        >
          {isMobile ? (
            <>
              <span>Pay ₹{amount.toFixed(2)}</span>
              <ArrowRight size={14} />
            </>
          ) : (
            <>
              <span>Pay ₹{amount.toFixed(2)}</span>
              <Smartphone size={14} />
            </>
          )}
        </button>

        {/* Desktop Popover */}
        {!isMobile && showDesktopPopover && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-[#111] border border-[#222] rounded-xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95">
            <h4 className="text-sm font-bold text-white mb-1">Pay {receiverName}</h4>
            <p className="text-xs text-gray-400 mb-3">Open any UPI app on your phone to pay.</p>
            
            <div className="flex items-center justify-between bg-[#1A1A1A] border border-[#333] rounded-lg p-2 mb-4">
              <span className="text-sm font-mono text-gray-300 truncate">{upiId}</span>
              <button 
                onClick={copyUpiId}
                className="p-1.5 text-[#C0FF34] hover:bg-[#C0FF34]/10 rounded transition-colors"
                title="Copy UPI ID"
              >
                <Copy size={14} />
              </button>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowDesktopPopover(false)}
                className="flex-1 py-2 bg-[#222] hover:bg-[#333] text-white text-xs font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkAsPaid}
                disabled={isSubmitting}
                className="flex-1 py-2 bg-[#C0FF34] hover:bg-[#aee62c] text-black text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "..." : "Mark Paid"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#111] border border-[#222] rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-[#C0FF34]/20 text-[#C0FF34] flex items-center justify-center mb-4">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-xl font-display font-bold text-white mb-2">Payment Confirmation</h3>
            <p className="text-gray-400 text-sm mb-6">
              Did you successfully pay <span className="font-mono text-white">₹{amount.toFixed(2)}</span> to {receiverName}?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleMarkAsPaid}
                disabled={isSubmitting}
                className="w-full py-3 bg-[#C0FF34] text-black font-semibold rounded-xl hover:bg-[#aee62c] transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Recording..." : "Yes, mark as paid"}
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="w-full py-3 bg-[#1A1A1A] border border-[#333] text-white font-semibold rounded-xl hover:bg-[#222] transition-colors disabled:opacity-50"
              >
                Not yet
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
