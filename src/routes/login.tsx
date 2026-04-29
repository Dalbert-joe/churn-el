import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { apiFetch } from "@/lib/api";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; email?: string; message?: string }>(
        "/login",
        { method: "POST", body: JSON.stringify({ email: email.trim().toLowerCase() }) },
      );
      if (res.success && res.email) {
        localStorage.setItem("churnel_email", res.email);
        navigate({ to: "/home" });
      } else {
        setError(res.message || "Unauthorized email");
      }
    } catch (err: any) {
      setError(err.message || "Unauthorized email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-black tracking-tight">CHURN-el</h1>
          <p className="mt-1 text-sm italic text-gray-500">Never Letting You Go....</p>
        </div>
        <form onSubmit={submit} className="space-y-4 border border-gray-200 rounded-lg p-6">
          <div>
            <label className="block text-sm font-medium text-black mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="you@example.com"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-black text-white rounded-md font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
