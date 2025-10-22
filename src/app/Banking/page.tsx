"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";

export default function Dashboard() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  
  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        // request only known-existing columns to avoid DB errors when schema differs
        const { data, error } = await supabase
          .from("customers")
          .select("name, balance, account_number");

        if (error) {
          console.error("Error fetching customers:", error?.message ?? String(error));
          setCustomers([]);
          return;
        }

        // fetch transactions so we can compute deposits/withdrawals per account
        let transactions: any[] = [];
        try {
          const tx = await supabase.from("transactions").select("*").order("created_at", { ascending: false });  // Note: using created_at as it's the default Supabase timestamp column name
          if (!tx.error && tx.data) transactions = tx.data;
        } catch (e) {
          transactions = [];
        }

        const depositsMap: Record<string, number> = {};
        const withdrawalsMap: Record<string, number> = {};
        const lastTypeMap: Record<string, string> = {};

        transactions.forEach((t: any) => {
          // accept both snake_case and camelCase column names and fall back on amount sign
          const acc = t.account_number ?? t.accountNumber ?? "";
          const amt = Number(t.amount ?? t.value) || 0;
          const ttRaw = (t.type ?? t.transfer_type ?? t.transferType ?? "").toString();
          const tt = ttRaw.toLowerCase();
          if (!acc) return;

          // record last transfer type (transactions already ordered by created_at desc)
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
                <th className="border px-4 py-2">Transfer Type</th>
                <th className="border px-4 py-2">Deposits</th>
                <th className="border px-4 py-2">Withdrawal</th>
                <th className="border px-4 py-2">Account Balance</th>
                <th className="border px-4 py-2">Account Number</th>
                <th className="border px-4 py-2">Other Details</th>
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
                customers.map((cust, index) => (
                  <tr key={index} className="text-center border-t">
                    <td className="border px-4 py-2">{cust.name}</td>
                    <td className="border px-4 py-2">{cust.last_transfer_type || "—"}</td>
                    <td className="border px-4 py-2">
                      {cust.deposits > 0 ? `₦${cust.deposits.toLocaleString()}` : "—"}
                    </td>
                    <td className="border px-4 py-2">
                      {cust.withdrawals > 0 ? `₦${cust.withdrawals.toLocaleString()}` : "—"}
                    </td>
                    <td className="border px-4 py-2">
                      ₦{Number(cust.balance).toLocaleString()}
                    </td>
                    <td className="border px-4 py-2">{cust.account_number}</td>
                    <td className="border px-4 py-2">
                      {cust.other_details ?? "—"}
                    </td>
                  </tr>
                ))
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
 