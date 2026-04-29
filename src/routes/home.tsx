import { createFileRoute, Link, useNavigate, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { apiFetch, isLoggedIn, logout } from "@/lib/api";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

export const Route = createFileRoute("/home")({
  component: HomePage,
});

type ChurnRow = { id: number; name: string; phone: string; area: string; churn_probability: number; churn_label: string };
type Trends = {
  monthly_customers: { month: string; count: number }[];
  monthly_sales: { month: string; total: number }[];
  area_distribution: Record<string, number>;
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function HomePage() {
  if (typeof window !== "undefined" && !isLoggedIn()) {
    return <Navigate to="/login" />;
  }
  const navigate = useNavigate();
  const [churn, setChurn] = useState<ChurnRow[]>([]);
  const [trends, setTrends] = useState<Trends | null>(null);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [c, t] = await Promise.all([
          apiFetch<ChurnRow[]>("/churn"),
          apiFetch<Trends>("/trends"),
        ]);
        setChurn(c);
        setTrends(t);
      } catch (e: any) {
        setError(e.message || "Failed to load data");
      }
    })();
  }, []);

  const highRisk = churn
    .filter((r) => r.churn_probability > 0.7)
    .sort((a, b) => b.churn_probability - a.churn_probability);

  const totalRevenue = trends?.monthly_sales.reduce((s, m) => s + m.total, 0) ?? 0;
  const totalCustomers = trends?.monthly_customers.reduce((s, m) => s + m.count, 0) ?? 0;
  const currentMonth = MONTHS[new Date().getMonth()];
  const currentRevenue = trends?.monthly_sales.find((m) => m.month === currentMonth)?.total ?? 0;
  const currentCustomers = trends?.monthly_customers.find((m) => m.month === currentMonth)?.count ?? 0;
  const prevMonthIdx = (new Date().getMonth() + 11) % 12;
  const prevMonth = MONTHS[prevMonthIdx];
  const prevRevenue = trends?.monthly_sales.find((m) => m.month === prevMonth)?.total ?? 0;
  const prevCustomers = trends?.monthly_customers.find((m) => m.month === prevMonth)?.count ?? 0;
  const revChange = prevRevenue ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0;
  const custChange = prevCustomers ? ((currentCustomers - prevCustomers) / prevCustomers) * 100 : 0;

  const topArea = trends
    ? Object.entries(trends.area_distribution)
        .filter(([k]) => k !== "Others")
        .sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—"
    : "—";

  // last 6 months bar chart
  const nowIdx = new Date().getMonth();
  const last6 = Array.from({ length: 6 }, (_, i) => MONTHS[(nowIdx - 5 + i + 12) % 12]);
  const last6Data = last6.map((m) => ({
    month: m,
    revenue: trends?.monthly_sales.find((s) => s.month === m)?.total ?? 0,
  }));

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <header className="border-b border-gray-200 px-6 py-5 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">CHURN-el</h1>
          <p className="text-sm italic text-gray-500">Never Letting You Go....</p>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-100"
        >
          Logout
        </button>
      </header>

      {error && <div className="px-6 pt-4 text-sm text-red-600">{error}</div>}

      <main className="px-6 py-8 max-w-6xl mx-auto space-y-12">
        {/* Section 1: Churn Prediction */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Churn Prediction</h2>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 text-sm border border-black text-black rounded-md hover:bg-black hover:text-white transition-colors"
            >
              AI SUGGESTION
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-3">High-risk customers (churn probability &gt; 70%)</p>
          <div className="border border-gray-200 rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Area</th>
                  <th className="px-4 py-3 font-medium text-right">Churn %</th>
                </tr>
              </thead>
              <tbody>
                {highRisk.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500">No high-risk customers</td></tr>
                ) : (
                  highRisk.map((r, i) => (
                    <tr key={r.id} className={i % 2 === 1 ? "bg-gray-50" : ""}>
                      <td className="px-4 py-2.5">{r.name}</td>
                      <td className="px-4 py-2.5">{r.phone}</td>
                      <td className="px-4 py-2.5">{r.area}</td>
                      <td className="px-4 py-2.5 text-right font-medium">{(r.churn_probability * 100).toFixed(1)}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 2: Analytics */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Overall Analytics</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <StatCard label="Total Revenue" value={`₹${totalRevenue.toLocaleString(undefined,{maximumFractionDigits:0})}`} />
            <StatCard label="Total Customers" value={totalCustomers.toString()} />
            <StatCard label={`${currentMonth} Revenue`} value={`₹${currentRevenue.toLocaleString(undefined,{maximumFractionDigits:0})}`} />
            <StatCard label={`${currentMonth} Customers`} value={currentCustomers.toString()} />
            <StatCard
              label="Revenue Change"
              value={
                <span className={revChange >= 0 ? "text-emerald-600" : "text-red-600"}>
                  {revChange >= 0 ? "▲" : "▼"} {Math.abs(revChange).toFixed(1)}%
                </span>
              }
            />
            <StatCard
              label="Customer Change"
              value={
                <span className={custChange >= 0 ? "text-emerald-600" : "text-red-600"}>
                  {custChange >= 0 ? "▲" : "▼"} {Math.abs(custChange).toFixed(1)}%
                </span>
              }
            />
            <StatCard label="Top Area" value={topArea} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-md p-4">
              <h3 className="text-sm font-medium mb-3">Current Month Analysis (Last 6 Months Revenue)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={last6Data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="month" stroke="#666" fontSize={12} />
                    <YAxis stroke="#666" fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="oklch(0.6 0.07 240)" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="border border-gray-200 rounded-md p-4">
              <h3 className="text-sm font-medium mb-3">Overall Revenue Trend</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends?.monthly_sales ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="month" stroke="#666" fontSize={12} />
                    <YAxis stroke="#666" fontSize={12} />
                    <Tooltip />
                    <Line type="monotone" dataKey="total" stroke="oklch(0.72 0.13 30)" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Actions */}
        <section className="flex flex-wrap gap-4 justify-center pt-4">
          <ActionLink to="/customers">View All Customers</ActionLink>
          <ActionLink to="/add-customer">Add Customer</ActionLink>
          <ActionLink to="/notification">Personalized Notification</ActionLink>
        </section>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-lg max-w-md w-full p-6 border border-gray-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-black">AI Retention Suggestions</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-black text-xl leading-none">×</button>
            </div>
            <ul className="space-y-2 text-sm text-black">
              <li>• Offer a limited-time discount to re-engage</li>
              <li>• Send a personalized re-engagement message</li>
              <li>• Reward with loyalty points or exclusive offer</li>
              <li>• Schedule a personalized follow-up call</li>
              <li>• Provide early access to new arrivals</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border border-gray-200 rounded-md p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="mt-2 text-xl font-semibold text-black">{value}</p>
    </div>
  );
}

function ActionLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="px-5 py-2.5 border border-black text-black rounded-md font-medium hover:bg-black hover:text-white transition-colors"
    >
      {children}
    </Link>
  );
}
