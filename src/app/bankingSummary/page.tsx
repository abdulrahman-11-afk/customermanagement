"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabase } from "../lib/supabaseClient";

export default function BankingSummary() {
  const [transactionsByMonth, setTransactionsByMonth] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

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
      const startOfYear = new Date(now.getFullYear(), 0, 1);

      // Fetch transactions + customer info (name + account number)
      const { data, error } = await supabase
        .from("transactions")
        .select("*, customers(name, account_number)")
        .gte("created_at", startOfYear.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) {
        setMessage("No transactions found this year");
        setLoading(false);
        return;
      }

      // Group transactions by month
      const grouped: Record<string, any[]> = {};
      data.forEach((tx) => {
        const date = new Date(tx.created_at);
        const key = date.toLocaleString("default", {
          month: "long",
          year: "numeric",
        });
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(tx);
      });

      setTransactionsByMonth(grouped);
      setMessage("");
    } catch (err) {
      console.error(err);
      setMessage("❌ Error fetching transactions");
    } finally {
      setLoading(false);
    }
  };

  // Compute yearly totals from the grouped transactions (works even before fetch completes)
  const { yearlyDeposit, yearlyWithdraw } = useMemo(() => {
    const allTx = Object.values(transactionsByMonth).flat();
    const deposit = allTx
      .filter((t) => t.type === "credit")
      .reduce((s, t) => s + Number(t.amount || 0), 0);
    const withdraw = allTx
      .filter((t) => t.type === "debit")
      .reduce((s, t) => s + Math.abs(Number(t.amount || 0)), 0);
    return { yearlyDeposit: deposit, yearlyWithdraw: withdraw };
  }, [transactionsByMonth]);

  return (
    <div className="flex flex-col h-screen">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-100 left-0 fixed flex h-[100vh] flex-col pt-22 p-4 overflow-y-auto z-20">
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
        {/* Added ml-64 to account for the fixed sidebar width and removed the typo 'absulute' */}
        <main className="flex-1 p-6 ml-64 overflow-y-auto">
          <div className="flex flex-col items-center justify-center">
            <h2 className="text-3xl text-green-400 font-bold my-2">
              MIDDLECROWN MULTIVENTURES
            </h2>
            <h3 className="text-lg text-gray-600 mb-6">Banking Summary Report</h3>
          </div>
          <div className="flex items-center mb-6 gap-10">
            <div className="flex items-center gap-x-2 w-60 rounded-md h-20 justify-center bg-green-200">
              <label>Yearly Deposits:</label>
              <p>{formatAmount(yearlyDeposit || 0)}</p>
            </div>
            <div className="flex items-center gap-x-2 w-60 rounded-md h-20 justify-center bg-red-200">
              <label>Yearly Withdrawal</label>
              <p>{formatAmount(yearlyWithdraw || 0)}</p>
            </div>
          </div>

          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : message ? (
            <p className="text-gray-500">{message}</p>
          ) : (
            Object.keys(transactionsByMonth).map((monthKey) => {
              const monthTx = transactionsByMonth[monthKey];

              const monthDeposit = monthTx
                .filter((t) => t.type === "credit")
                .reduce((sum, t) => sum + Number(t.amount), 0);
              const monthWithdraw = monthTx
                .filter((t) => t.type === "debit")
                .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

              return (
                <div key={monthKey} className="bg-white p-4 rounded-lg shadow-md mb-8">
                  <h4 className="text-lg font-semibold text-gray-700 mb-3">
                    Transactions for {monthKey}{" "}
                    <span className="text-green-600 ml-2">(In: {formatAmount(monthDeposit)})</span>{" "}
                    <span className="text-red-600 ml-2">(Out: {formatAmount(monthWithdraw)})</span>
                  </h4>

                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-left text-sm">
                        <th className="p-2 border">Date</th>
                        <th className="p-2 border">Type</th>
                        <th className="p-2 border">Customer</th>
                        <th className="p-2 border">Description</th>
                        <th className="p-2 border">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthTx.map((tx) => (
                        <tr key={tx.id} className="border-b hover:bg-gray-50 text-sm">
                          <td className="p-2 border">
                            {new Date(tx.created_at).toLocaleDateString()}{" "}
                            {new Date(tx.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td
                            className={`p-2 border font-semibold ${tx.type === "credit" ? "text-green-600" : "text-red-600"}`}
                          >
                            {tx.type === "credit" ? "Credit" : "Debit"}
                          </td>
                          <td className="p-2 border">
                            {tx.customers?.name
                              ? `${tx.customers.name} (${tx.customers.account_number || "N/A"})`
                              : "—"}
                          </td>
                          <td className="p-2 border">{tx.description || "-"}</td>
                          <td
                            className={`p-2 border text-right ${tx.type === "credit" ? "text-green-600" : "text-red-600"}`}
                          >
                            {formatAmount(Math.abs(Number(tx.amount)))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })
          )}
        </main>
      </div>
    </div>
  );
}
