import { useNavigate } from "react-router-dom";

export default function PastPatients() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-blue-100 px-6 py-8 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <button
          onClick={() => navigate("/physician/dashboard")}
          className="mb-6 rounded-xl bg-white px-4 py-2 text-sm font-bold text-sky-600 shadow-sm ring-1 ring-slate-100"
        >
          ← Back to dashboard
        </button>

        <div className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-100">
          <h1 className="text-3xl font-bold tracking-tight">Past patients</h1>
          <p className="mt-2 text-slate-500">
            This page can later show completed or previous patient appointments.
          </p>

          <div className="mt-8 rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
            <p className="font-bold text-slate-900">No past patients yet</p>
            <p className="mt-2 text-sm text-slate-500">
              Once appointments are completed, they can appear here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}