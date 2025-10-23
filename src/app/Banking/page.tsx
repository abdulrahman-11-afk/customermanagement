"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "../lib/supabaseClient";
import { ErrorBoundary } from "../components/ErrorBoundary";

export default function BankingDashboard() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [transactionsByAccount, setTransactionsByAccount] = useState<Record<string, any[]>>({});
  const [txLoading, setTxLoading] = useState<Record<string, boolean>>({});

  
  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const supabase = getSupabase();
        if (!supabase) {
          throw new Error('Supabase client not initialized');
        }
        // request only known-existing columns to avoid DB errors when schema differs
        const { data, error } = await supabase
          .from("customers")
          .select("id, name, balance, account_number");

        if (error) {
          console.error("Error fetching customers:", error?.message ?? String(error));
          setCustomers([]);
          return;
        }

        // fetch transactions so we can compute deposits/withdrawals per account
        let transactions: any[] = [];
        try {
                                                  const tx = await supabase.from("transactions").select("*").order("created_at", { ascending: false }).eq("type", "debit").like("description", "%Registration%");  // Note: using created_at as it's the default Supabase timestamp column name
          if (tx && !tx.error && tx.data) transactions = tx.data;
        } catch (e) {
          transactions = [];
        }

        const depositsMap: Record<string, number> = {};
        const withdrawalsMap: Record<string, number> = {};
        const lastTypeMap: Record<string, string> = {};

        transactions.forEach((t: any) => {
          const acc = t.account_number ?? t.accountNumber ?? "";
          const amt = Number(t.amount ?? t.value) || 0;
          const ttRaw = (t.type ?? t.transfer_type ?? t.transferType ?? "").toString();
          const tt = ttRaw.toLowerCase();
          if (!acc) return;
          if (!lastTypeMap[acc]) {
            lastTypeMap[acc] = tt || (amt > 0 ? "credit" : amt < 0 ? "debit" : "other");
          }

          if (tt.includes("cred") || (tt === "" && amt > 0)) {
            depositsMap[acc] = (depositsMap[acc] || 0) + Math.abs(amt);
          } else if (tt.includes("deb") || tt.includes("wit") || (tt === "" && amt < 0)) {
            withdrawalsMap[acc] = (withdrawalsMap[acc] || 0) + Math.abs(amt);
          } else {
            // fallback by sign
            if (amt >= 0) depositsMap[acc] = (depositsMap[acc] || 0) + Math.abs(amt);
            else withdrawalsMap[acc] = (withdrawalsMap[acc] || 0) + Math.abs(amt);
          }
        });

        const enriched = (data || []).map((c: any) => ({
          ...c,
          deposits: depositsMap[c.account_number] || 0,
          withdrawals: withdrawalsMap[c.account_number] || 0,
          last_transfer_type: lastTypeMap[c.account_number] || "—",
        }));

        setCustomers(enriched);
      } catch (err) {
        console.error("Unexpected error fetching customers:", (err as Error).message ?? String(err));
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-100 flex h-[100vh] flex-col pt-22 p-4">
          <nav className="flex flex-col gap-7">
            <Link href="/dashboard" className="ml-5">
              Dashboard
            </Link>
            <Link href="/newcustomer" className="ml-5">
              New Customer
            </Link>
            <Link href="/customer" className="ml-5">
              Existing Customers
            </Link>
            <Link href="/servicelist" className="ml-5">
              Service List
            </Link>
            <Link
              href="/Banking"
              className="bg-green-400 w-40 flex items-center justify-center rounded-md h-10"
            >
              Banking
            </Link>
            <Link href="/Loan" className="ml-5">
              Loan
            </Link>
            <Link href="/Expenses" className="ml-5">
              Expenses
            </Link>
            <Link href="/reports" className="ml-5">
              Reports
            </Link>
          </nav>
        </aside>

        {/* Main Section */}
        <main className="flex-1 p-6">
          <div className="flex items-center justify-center">
            <h2 className="text-3xl cursor-pointer text-green-400 font-bold my-2">
              MIDDLECROWN MULTIVENTURES
            </h2>
          </div>

          <div className="flex items-center justify-center gap-x-30 my-7">
            <Link href="/Credit">
              <div className="w-40 bg-green-400 cursor-pointer transform hover:scale-105 transition ease duration-300 hover:bg-green-500 text-white h-20 rounded-lg flex items-center justify-center text-lg">
                <p>Credit/Deposit</p>
              </div>
            </Link>
            <Link href="/Debit">
              <div className="w-40 bg-green-400 transform hover:scale-105 transition ease duration-300 hover:bg-green-500 text-white h-20 rounded-lg flex items-center justify-center text-lg">
                <p>Debit/Withdrawal</p>
              </div>
            </Link>
          </div>

          {/* 🧾 Table */}
          <table className="min-w-full border border-gray-100">
            <thead className="bg-green-400 text-white">
              <tr>
                <th className="border px-4 py-2">Name</th>
                <th className="border px-4 py-2">Account Balance</th>
                <th className="border px-4 py-2">Account Number</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-4">
                    Loading...
                  </td>
                </tr>
              ) : customers.length > 0 ? (
                customers.map((cust, index) => {
                  const id = String(cust.id ?? index);
                  const isExpanded = !!expanded[id];
                  const txs = transactionsByAccount[id] || [];
                  return (
                    <React.Fragment key={id}>
                      <tr className="text-center border-t cursor-pointer hover:bg-gray-50" onClick={async () => {
                          // Toggle expand/collapse
                          setExpanded((s) => ({ ...s, [id]: !s[id] }));
                          // If expanding and not cached, fetch transactions by customer_id
                          if (!expanded[id] && !(transactionsByAccount[id] && transactionsByAccount[id].length)) {
                            setTxLoading((s) => ({ ...s, [id]: true }));
                            try {
                              const supabase = getSupabase();
                              if (!supabase) throw new Error("Supabase client not initialized");
                              const { data: txData, error: txError } = await supabase
                                .from("transactions")
                                .select("*")
                                .eq("customer_id", cust.id)
                                .order("created_at", { ascending: false });
                              if (txError) {
                                console.error("Error fetching transactions:", txError);
                                setTransactionsByAccount((s) => ({ ...s, [id]: [] }));
                              } else {
                                setTransactionsByAccount((s) => ({ ...s, [id]: txData || [] }));
                              }
                            } catch (err) {
                              console.error("Error fetching transactions:", err);
                              setTransactionsByAccount((s) => ({ ...s, [id]: [] }));
                            } finally {
                              setTxLoading((s) => ({ ...s, [id]: false }));
                            }
                          }
                        }}
                      >
                        <td className="border px-4 py-2 text-left pl-8 flex items-center gap-3">
                          <button className="text-sm text-gray-600 w-6 h-6 flex items-center justify-center rounded-full bg-white border">
                            {isExpanded ? "-" : "+"}
                          </button>
                          <span>{cust.name}</span>
                        </td>
                        <td className="border px-4 py-2">₦{Number(cust.balance).toLocaleString()}</td>
                        <td className="border px-4 py-2">{cust.account_number}</td>
                      </tr>

                      {isExpanded && (
                        <tr key={(id || index) + "-txs"} className="bg-gray-50">
                          <td colSpan={3} className="p-4">
                            <div className="mb-3 flex items-center justify-between">
                              <div className="text-sm text-gray-700">Transaction history for <strong>{cust.name}</strong></div>
                              <div className="text-sm text-gray-500">{txLoading[id] ? "Loading..." : `${txs.length} record(s)`}</div>
                            </div>

                            {txLoading[id] ? (
                              <div className="text-center py-4">Loading transactions...</div>
                            ) : txs.length === 0 ? (
                              <div className="text-center text-sm text-gray-500 py-4">No transactions found for this account.</div>
                            ) : (
                              <table className="min-w-full border">
                                <thead className="bg-white text-left">
                                  <tr>
                                    <th className="px-3 py-2">Date</th>
                                    <th className="px-3 py-2">Type</th>
                                    <th className="px-3 py-2">Amount (₦)</th>
                                    <th className="px-3 py-2">Description</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {txs.map((t: any, i: number) => (
                                    <tr key={i} className="border-t">
                                      <td className="px-3 py-2 text-sm">{t.created_at ? new Date(t.created_at).toLocaleString() : "—"}</td>
                                      <td className="px-3 py-2 text-sm">{(t.type ?? t.transfer_type ?? t.transferType ?? (Number(t.amount) >= 0 ? "credit" : "debit")).toString()}</td>
                                      <td className="px-3 py-2 text-sm">₦{Number(t.amount ?? t.value ?? 0).toLocaleString()}</td>
                                      <td className="px-3 py-2 text-sm">{t.description ?? t.note ?? "—"}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-gray-500">
                    No customers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </main>
      </div>
    </div>
  );
}
 