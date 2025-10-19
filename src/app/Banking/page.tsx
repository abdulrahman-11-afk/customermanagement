"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";

export default function Dashboard() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        // request only known-existing columns to avoid DB errors when schema differs
        const { data, error } = await supabase
          .from("customers")
          .select("name, balance, account_number");

        if (error) {
          // Log a safe string representation of the error to avoid circular JSON issues
          console.error("Error fetching customers:", error?.message ?? String(error));
          setCustomers([]);
        } else {
          setCustomers(data || []);
        }
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
                    <td className="border px-4 py-2 text-gray-400">—</td>
                    <td className="border px-4 py-2 text-gray-400">—</td>
                    <td className="border px-4 py-2 text-gray-400">—</td>
                    <td className="border px-4 py-2">
                      ₦{Number(cust.balance).toLocaleString()}
                    </td>
                    <td className="border px-4 py-2">{cust.account_number}</td>
                    <td className="border px-4 py-2">{(cust as any).other_details ?? "—"}</td>
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
 