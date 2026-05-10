import { useNavigate } from "react-router-dom";

export default function PatientDashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-blue-100 px-6 py-8 text-gray-800">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-light tracking-tight text-sky-600">
              MediBook
            </h1>
            <p className="mt-1 text-sm text-gray-500">Patient dashboard</p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-sky-100 bg-white/85 px-4 py-3 shadow-sm">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">Patient</p>
              <p className="text-xs font-medium text-gray-400">
                Patient account
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-700">
              P
            </div>
          </div>
        </header>

        <main className="space-y-6">
          <section className="rounded-3xl border border-gray-100 bg-white/95 p-6 shadow-xl shadow-gray-200/50">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-sky-50 p-4">
                <p className="text-2xl font-semibold text-gray-900">0</p>
                <p className="mt-1 text-sm text-gray-500">Upcoming</p>
              </div>

              <div className="rounded-2xl bg-amber-50 p-4">
                <p className="text-2xl font-semibold text-gray-900">0</p>
                <p className="mt-1 text-sm text-gray-500">Pending</p>
              </div>

              <div className="rounded-2xl bg-emerald-50 p-4">
                <p className="text-2xl font-semibold text-gray-900">0</p>
                <p className="mt-1 text-sm text-gray-500">Confirmed</p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-gray-100 bg-white/95 p-8 shadow-xl shadow-gray-200/50">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
              
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
                  Your appointments
                </h2>
               
              </div>

              <button
                onClick={() => navigate("/patient/book")}
                className="rounded-xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-sky-100 transition hover:bg-sky-600"
              >
                Book appointment
              </button>
            </div>

            <div className="rounded-3xl border border-dashed border-sky-200 bg-sky-50/70 p-10 text-center">
             
              <h3 className="text-xl font-semibold text-gray-900">
                No appointments yet
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                Once you book an appointment, it will appear here with its current status.
              </p>
             
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}