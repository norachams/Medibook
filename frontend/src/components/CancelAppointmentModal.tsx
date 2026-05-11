import { useState } from "react";

interface CancelAppointmentModalProps {
  appointmentLabel: string;
  loading: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export default function CancelAppointmentModal({
  appointmentLabel,
  loading,
  onClose,
  onConfirm,
}: CancelAppointmentModalProps) {
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900">
          Cancel appointment?
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          Are you sure you want to cancel{" "}
          <span className="font-semibold text-gray-700">{appointmentLabel}</span>?
          This appointment will be removed from your upcoming appointments.
        </p>

        <div className="mt-5">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Reason for cancelling
          </label>
          <textarea
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Briefly explain why you are cancelling..."
            rows={4}
            className="w-full resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          />
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Keep appointment
          </button>

          <button
            type="button"
            disabled={loading || reason.trim().length === 0}
            onClick={() => onConfirm(reason.trim())}
            className={[
              "flex-1 rounded-xl py-3 text-sm font-semibold text-white transition",
              loading || reason.trim().length === 0
                ? "cursor-not-allowed bg-red-300"
                : "bg-red-500 hover:bg-red-600",
            ].join(" ")}
          >
            {loading ? "Cancelling..." : "Submit cancellation"}
          </button>
        </div>
      </div>
    </div>
  );
}