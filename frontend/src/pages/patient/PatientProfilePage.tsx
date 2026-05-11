import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface PatientProfile {
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  allergies: string;
  medications: string;
  medical_conditions: string;
  medical_notes: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
}

const emptyProfile: PatientProfile = {
  full_name: "",
  email: "",
  phone: "",
  date_of_birth: "",
  allergies: "",
  medications: "",
  medical_conditions: "",
  medical_notes: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
};

export default function PatientProfilePage() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [profile, setProfile] = useState<PatientProfile>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateField = (field: keyof PatientProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    fetch("http://localhost:8000/api/patient/profile", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load profile.");
        return res.json();
      })
      .then((data: PatientProfile) => setProfile(data))
      .catch(() => setError("Could not load your profile."))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(null);
    setError(null);

    try {
      const res = await fetch("http://localhost:8000/api/patient/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to update profile.");
      }

      setSuccess("Your profile was updated successfully.");
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-white via-sky-50 to-blue-100">
        <p className="text-sm text-gray-400">Loading profile…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-white via-sky-50 to-blue-100 px-6 py-8 text-gray-800">
      <div className="mx-auto max-w-4xl">
        <button
          onClick={() => navigate("/patient/dashboard")}
          className="mb-6 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition hover:bg-gray-50"
        >
          ← Back to dashboard
        </button>

        <div className="rounded-3xl border border-gray-100 bg-white/95 p-8 shadow-xl shadow-gray-200/50">
          <div className="mb-8">
            
            <h1 className="text-3xl font-bold text-gray-900">
              Edit your information
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Update your basic details and medical history so physicians can better understand your background before an appointment.
            </p>
          </div>

          {success && (
            <div className="mb-6 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700">
              {success}
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <section>
              <h2 className="mb-4 text-lg font-bold text-gray-900">
                Basic information
              </h2>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Full name
                  </label>
                  <input
                    value={profile.full_name}
                    onChange={(e) => updateField("full_name", e.target.value)}
                    placeholder="Alex Rivera"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="alex@example.com"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Phone number
                  </label>
                  <input
                    value={profile.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="+1 123 456 7890"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Date of birth
                  </label>
                  <input
                    type="date"
                    value={profile.date_of_birth}
                    onChange={(e) => updateField("date_of_birth", e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  />
                </div>
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-lg font-bold text-gray-900">
                Medical history
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Allergies
                  </label>
                  <textarea
                    value={profile.allergies}
                    onChange={(e) => updateField("allergies", e.target.value)}
                    placeholder="Example: Penicillin, peanuts, seasonal allergies..."
                    rows={3}
                    className="w-full resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Current medications
                  </label>
                  <textarea
                    value={profile.medications}
                    onChange={(e) => updateField("medications", e.target.value)}
                    placeholder="Example: Vitamin D, inhaler, blood pressure medication..."
                    rows={3}
                    className="w-full resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Medical conditions
                  </label>
                  <textarea
                    value={profile.medical_conditions}
                    onChange={(e) => updateField("medical_conditions", e.target.value)}
                    placeholder="Example: Asthma, diabetes, migraines, previous surgeries..."
                    rows={3}
                    className="w-full resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Additional notes
                  </label>
                  <textarea
                    value={profile.medical_notes}
                    onChange={(e) => updateField("medical_notes", e.target.value)}
                    placeholder="Anything else you would want a physician to know..."
                    rows={4}
                    className="w-full resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  />
                </div>
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-lg font-bold text-gray-900">
                Emergency contact
              </h2>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Contact name
                  </label>
                  <input
                    value={profile.emergency_contact_name}
                    onChange={(e) =>
                      updateField("emergency_contact_name", e.target.value)
                    }
                    placeholder="Maria Rivera"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Contact phone
                  </label>
                  <input
                    value={profile.emergency_contact_phone}
                    onChange={(e) =>
                      updateField("emergency_contact_phone", e.target.value)
                    }
                    placeholder="+1 987 654 3210"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  />
                </div>
              </div>
            </section>

            <div className="flex justify-end gap-3 border-t border-gray-100 pt-6">
              <button
                type="button"
                onClick={() => navigate("/patient/dashboard")}
                className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className={[
                  "rounded-xl px-5 py-3 text-sm font-semibold text-white transition",
                  saving
                    ? "cursor-not-allowed bg-sky-300"
                    : "bg-sky-500 shadow-md shadow-sky-100 hover:bg-sky-600",
                ].join(" ")}
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}