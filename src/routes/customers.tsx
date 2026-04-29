import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { apiFetch, isLoggedIn } from "@/lib/api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export const Route = createFileRoute("/customers")({
  component: CustomersPage,
});

type Customer = {
  id: number; name: string; phone: string; area: string;
  churn_probability: number; churn_label: string;
};

type CustomerDetail = Customer & {
  address: string; age: number | null; gender: string;
  monthly_spending: { month: string; amount: number }[];
  churn_reason: string;
};

function CustomersPage() {
  if (typeof window !== "undefined" && !isLoggedIn()) return <Navigate to="/login" />;
  const [rows, setRows] = useState<Customer[]>([]);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<CustomerDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    apiFetch<Customer[]>("/customers")
      .then(setRows)
      .catch((e) => setError(e.message));
  }, []);

  const open = async (id: number) => {
    setLoadingDetail(true);
    setSelected(null);
    try {
      const data = await apiFetch<CustomerDetail>(`/customer/${id}`);
      setSelected(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingDetail(false);
    }
  };

  const filtered = rows.filter((r) =>
    [r.name, r.phone, r.area].join(" ").toLowerCase().includes(search.toLowerCase())
  );

  const labelColor = (l: string) =>
    l === "High" ? "text-red-600" : l === "Medium" ? "text-amber-600" : "text-emerald-600";

  return (
    <div className="min-h-screen bg-white text-black">
      <header className="border-b border-gray-200 px-6 py-5 flex items-center justify-between">
        <div>
          <Link to="/home" className="text-sm text-gray-500 hover:text-black">← Back</Link>
          <h1 className="text-2xl font-bold mt-1">All Customers</h1>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          className="px-3 py-2 border border-gray-300 rounded-md text-sm w-64 focus:outline-none focus:ring-2 focus:ring-black"
        />
      </header>
      <main className="px-6 py-6 max-w-6xl mx-auto">
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <div className="border border-gray-200 rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Area</th>
                <th className="px-4 py-3 font-medium text-right">Churn %</th>
                <th className="px-4 py-3 font-medium">Risk</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr
                  key={r.id}
                  onClick={() => open(r.id)}
                  className={`cursor-pointer hover:bg-gray-100 ${i % 2 === 1 ? "bg-gray-50" : ""}`}
                >
                  <td className="px-4 py-2.5">{r.name}</td>
                  <td className="px-4 py-2.5">{r.phone}</td>
                  <td className="px-4 py-2.5">{r.area}</td>
                  <td className="px-4 py-2.5 text-right">{(r.churn_probability * 100).toFixed(1)}%</td>
                  <td className={`px-4 py-2.5 font-medium ${labelColor(r.churn_label)}`}>{r.churn_label}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">No customers</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {(selected || loadingDetail) && (
        <div className="fixed inset-0 bg-black/40 flex justify-end z-50" onClick={() => setSelected(null)}>
          <div className="bg-white w-full max-w-md h-full overflow-y-auto p-6 border-l border-gray-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Customer Details</h2>
              <button onClick={() => setSelected(null)} className="text-2xl leading-none text-gray-500 hover:text-black">×</button>
            </div>
            {loadingDetail && <p className="text-sm text-gray-500">Loading…</p>}
            {selected && (
              <div className="space-y-4 text-sm">
                <Field label="Name" value={selected.name} />
                <Field label="Phone" value={selected.phone} />
                <Field label="Area" value={selected.area} />
                <Field label="Address" value={selected.address} />
                <Field label="Age" value={selected.age?.toString() ?? "—"} />
                <Field label="Gender" value={selected.gender || "—"} />
                <Field label="Churn Probability" value={`${(selected.churn_probability * 100).toFixed(1)}% (${selected.churn_label})`} />
                <Field label="Churn Reason" value={selected.churn_reason} />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Monthly Spending</p>
                  {selected.monthly_spending.length === 0 ? (
                    <p className="text-gray-500">No transactions</p>
                  ) : (
                    <div className="h-48 border border-gray-200 rounded-md p-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={selected.monthly_spending}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                          <XAxis dataKey="month" stroke="#666" fontSize={11} />
                          <YAxis stroke="#666" fontSize={11} />
                          <Tooltip />
                          <Line type="monotone" dataKey="amount" stroke="oklch(0.72 0.06 150)" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-black">{value}</p>
    </div>
  );
}
