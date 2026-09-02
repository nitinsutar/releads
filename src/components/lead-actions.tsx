"use client";

import { Check, Clock3, Phone, MessageCircle } from "lucide-react";
import { Lead } from "@/lib/types";
import { callHref, shiftDate, whatsappHref } from "@/lib/actions";

export function LeadActions({
  lead,
  projectName,
  sender,
  onFollowup,
  compact
}: {
  lead: Lead;
  projectName: string;
  sender: string;
  onFollowup?: (nextDate: string, kind: "done" | "snooze") => void;
  compact?: boolean;
}) {
  const closed = lead.status === "Lost" || lead.status === "Booked / Closed";
  return (
    <div className={`flex flex-wrap items-center ${compact ? "gap-1.5" : "gap-2"}`}>
      <a href={callHref(lead.phone)} className="btn-ghost bg-sky-50 text-sky-600 hover:bg-sky-100">
        <Phone className="h-3.5 w-3.5" /> Call
      </a>
      <a href={whatsappHref(lead, projectName, sender)} target="_blank" rel="noreferrer" className="btn-ghost bg-[#E8F8F5] text-whatsapp hover:bg-[#D4F1EB]">
        <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
      </a>
      {onFollowup && !closed && (
        <>
          <button type="button" onClick={() => onFollowup(shiftDate(3), "done")} className="btn-ghost bg-brand-50 text-brand-700 hover:bg-brand-100">
            <Check className="h-3.5 w-3.5" /> Done +3
          </button>
          <button type="button" onClick={() => onFollowup(shiftDate(1), "snooze")} className="btn-ghost bg-sun-50 text-sun-600 hover:bg-sun-100">
            <Clock3 className="h-3.5 w-3.5" /> Snooze +1
          </button>
        </>
      )}
    </div>
  );
}
