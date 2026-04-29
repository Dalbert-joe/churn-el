import { createFileRoute, Link, useNavigate, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { apiFetch, isLoggedIn } from "@/lib/api";

export const Route = createFileRoute("/add-customer")({
  component: AddCustomerPage,
});

function AddCustomerPage() {
  if (typeof window !== "undefined" && !isLoggedIn()) return <Navigate to="/login" />;
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", phone: "", area: "", address: "", age: "", gender: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    try {
      const payload: any = {
        name: form.name, phone: form.phone, area: form.area, address: form.address,
        gender: form.gender,
      };
      if (form.age) payload.age = parseInt(form.age, 10);
      const res = await apiFetch<{ success: boolean; id?: number; message?: string }>(
        "/add-customer",
        { method: "POST", body: JSON.stringify(payload) },
      );
      if (res.success) {
        setSuccess(`Customer added (ID ${res.id}). Redirecting…`);
        setTimeout(() => navigate({ to: "/customers" }), 900);
      } else {
        setError(res.message || "Failed to add customer");
      }
    } catch (err: any) {
      setError(err.message || "Failed to add customer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <header className="border-b border-gray-200 px-6 py-5">
        <Link to="/home" className="text-sm text-gray-500 hover:text-black">← Back</Link>
        <h1 className="text-2xl font-bold mt-1">Add Customer</h1>
      </header>
      <main className="px-6 py-8 max-w-lg mx-auto">
        <form onSubmit={submit} className="space-y-4 border border-gray-200 rounded-md p-6">
          <Input label="Name *" value={form.name} onChange={(v) => update("name", v)} required />
          <Input label="Phone *" value={form.phone} onChange={(v) => update("phone", v)} required />
          <Input label="Area *" value={form.area} onChange={(v) => update("area", v)} required />
          <Input label="Address *" value={form.address} onChange={(v) => update("address", v)} required />
          <Input label="Age" type="number" value={form.age} onChange={(v) => update("age", v)} />
          <div>
            <label className="block text-sm font-medium mb-1">Gender</label>
            <select
              value={form.gender}
              onChange={(e) => update("gender", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="">—</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-emerald-600">{success}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-black text-white rounded-md font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? "Saving…" : "Add Customer"}
          </button>
        </form>
      </main>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", required = false }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        type={type} required={required} value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
      />
    </div>
  );
}
