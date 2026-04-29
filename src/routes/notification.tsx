import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { apiFetch, isLoggedIn } from "@/lib/api";

export const Route = createFileRoute("/notification")({
  component: NotificationPage,
});

function NotificationPage() {
  if (typeof window !== "undefined" && !isLoggedIn()) return <Navigate to="/login" />;
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null); setLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; message: string }>(
        "/send-whatsapp",
        { method: "POST", body: JSON.stringify({ message }) },
      );
      setResult({ ok: res.success, text: res.message });
    } catch (err: any) {
      setResult({ ok: false, text: err.message || "Failed to send" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <header className="border-b border-gray-200 px-6 py-5">
        <Link to="/home" className="text-sm text-gray-500 hover:text-black">← Back</Link>
        <h1 className="text-2xl font-bold mt-1">Personalized Notification</h1>
      </header>
      <main className="px-6 py-8 max-w-lg mx-auto">
        <form onSubmit={send} className="space-y-4 border border-gray-200 rounded-md p-6">
          <div>
            <label className="block text-sm font-medium mb-1">Message</label>
            <textarea
              required rows={6} value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Type your WhatsApp message…"
            />
          </div>
          {result && (
            <p className={`text-sm ${result.ok ? "text-emerald-600" : "text-red-600"}`}>{result.text}</p>
          )}
          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="w-full py-2 bg-black text-white rounded-md font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? "Sending…" : "Send WhatsApp"}
          </button>
        </form>
      </main>
    </div>
  );
}
