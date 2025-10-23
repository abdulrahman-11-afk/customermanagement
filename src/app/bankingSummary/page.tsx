"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "../lib/supabaseClient";

export default function BankingSummary() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [totals, setTotals] = useState({
    yearDeposit: 0,
    yearWithdraw: 0,
    monthDeposit: 0,
    monthWithdraw: 0,
  });

  // Helper: Format Naira currency
  const formatAmount = (amt: number) =>
    "₦" + amt.toLocaleString(undefined, { minimumFractionDigits: 2 });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    const supabase = getSupabase();
    if (!supabase) {
      setMessage("❌ Supabase not initialized");
      setLoading(false);
      return;
    }

    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfYear = new Date(now.getFullYear(), 0, 1);

      // Fetch all transactions for the current year
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .gte("created_at", startOfYear.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        setMessage("No transactions found this year");
        setTransactions([]);
        setLoading(false);
        return;
      }

      // Separate year & month transactions
      const monthTx = data.filter(
        (tx) => new Date(tx.created_at).getMonth() === now.getMonth()
      );

      const yearDeposit = data
        .filter((t) => t.type === "credit")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const yearWithdraw = data
        .filter((t) => t.type === "debit")
        .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

      const monthDeposit = monthTx
        .filter((t) => t.type === "credit")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const monthWithdraw = monthTx
        .filter((t) => t.type === "debit")
        .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

      setTotals({ yearDeposit, yearWithdraw, monthDeposit, monthWithdraw });
      setTransactions(monthTx);
      setMessage("");
    } catch (err) {
      console.error(err);
      setMessage("❌ Error fetching transactions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-100 flex h-[100vh] flex-col pt-22 p-4">
          <nav className="flex flex-col gap-7">
            <a href="/dashboard" className="ml-5">Dashboard</a>
            <a href="/newcustomer" className="ml-5">New Customer</a>
            <a href="/customer" className="ml-5">Existing Customers</a>
            <a href="/servicelist" className="ml-5">Service List</a>
            <a href="/Banking" className="ml-5">Banking</a>
            <a href="/Loan" className="ml-5">Loan</a>
            <a href="/Expenses" className="ml-5">Expenses</a>
            <a href="/reports" className="ml-5">Reports</a>
          </nav>
        </aside>

        {/* Main Section */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="flex flex-col items-center justify-center">
            <h2 className="text-3xl text-green-400 font-bold my-2">
              MIDDLECROWN MULTIVENTURES
            </h2>
            <h3 className="text-lg text-gray-600 mb-6">Banking Summary Report</h3>
          </div>

          {/* Totals Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-green-100 p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Total Deposited (Year)</p>
              <h3 className="text-xl text-green-600 font-bold">{formatAmount(totals.yearDeposit)}</h3>
            </div>

            <div className="bg-red-100 p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Total Withdrawn (Year)</p>
              <h3 className="text-xl text-red-600 font-bold">{formatAmount(totals.yearWithdraw)}</h3>
            </div>

            <div className="bg-green-100 p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Total Deposited (Month)</p>
              <h3 className="text-xl text-green-600 font-bold">{formatAmount(totals.monthDeposit)}</h3>
            </div>

            <div className="bg-red-100 p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Total Withdrawn (Month)</p>
              <h3 className="text-xl text-red-600 font-bold">{formatAmount(totals.monthWithdraw)}</h3>
            </div>
          </div>

          {/* Transaction History */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h4 className="text-lg font-semibold text-gray-700 mb-3">
              Transactions for {new Date().toLocaleString("default", { month: "long", year: "numeric" })}
            </h4>

            {loading ? (
              <p className="text-gray-500">Loading...</p>
            ) : message ? (
              <p className="text-gray-500">{message}</p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-left text-sm">
                    <th className="p-2 border">Date</th>
                    <th className="p-2 border">Type</th>
                    <th className="p-2 border">Description</th>
                    <th className="p-2 border">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b hover:bg-gray-50 text-sm">
                      <td className="p-2 border">
                        {new Date(tx.created_at).toLocaleDateString()}{" "}
                        {new Date(tx.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td
                        className={`p-2 border font-semibold ${
                          tx.type === "credit" ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {tx.type === "credit" ? "Credit" : "Debit"}
                      </td>
                      <td className="p-2 border">{tx.description || "-"}</td>
                      <td
                        className={`p-2 border text-right ${
                          tx.type === "credit" ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {formatAmount(Math.abs(Number(tx.amount)))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
