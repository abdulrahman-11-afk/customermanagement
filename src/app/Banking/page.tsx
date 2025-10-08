"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Dashboard() {
  const router = useRouter();

  return (
    <div className="flex flex-col h-screen">
      <div className="flex ">
        <aside className="w-64 bg-gray-100 flex h-[100vh] flex-col pt-22 p-4">
          <nav className="flex flex-col gap-7">
            <Link href="/dashboard" className="ml-5">Dashboard</Link>
            <Link href="/newcustomer" className="ml-5">New Customer</Link>
            <Link href="/customer" className="ml-5">Existing Customers</Link>
            <Link href="/servicelist" className="ml-5">Service List</Link>
            <Link href="/Banking" className="bg-green-400 w-40 flex items-center justify-center rounded-md h-10">Banking</Link>
            <Link href="/Loan" className="ml-5">Loan</Link>
            <Link href="/Expenses" className="ml-5">Expenses</Link>
            <Link href="/reports" className="ml-5">Reports</Link>
          </nav>
        </aside>
        <main className="flex-1 p-6 ">
          <div className="flex items-center justify-center">
            <h2 className="text-3xl cursor-pointer text-green-400 font-bold my-2"> MIDDLECROWN MULTIVENTURES</h2>
          </div>
          <div className="flex items-center justify-center gap-x-30 my-7">
            <Link href="/Credit"><div className="w-40 bg-green-400 cursor-pointer transform hover:scale-105 transition ease duration-300 hover:bg-green-500 text-white h-20 rounded-lg flex items-center justify-center text-lg">
              <p>Credit/Deposit</p>
            </div></Link>
            <Link href="/Debit"><div className="w-40 bg-green-400 transform hover:scale-105 transition ease duration-300 hover:bg-green-500 text-white h-20 rounded-lg flex items-center justify-center text-lg">
              <p>Debit/Withdrawal</p>
            </div>
            </Link>
          </div>
          <table className="min-w-full border border-gray-100">
            <thead className="bg-green-400 text-white">
              <tr>
                <th className="border px-4 py-2">Name</th>
                <th className="border px-4 py-2">Transfer Type</th>
                <th className="border px-4 py-2">Deposits</th>
                <th className="border px-4 py-2">Withdrawal</th>
                <th className="border px-4 py-2">Account Balance</th>
                <th className="border px-4 py-2">Account Number</th>
                <th className="border px-4 py-2">Other details</th>
                <th className="border px-4 py-2">Actions</th>
              </tr>
            </thead>
          </table>
        </main>

      </div>
    </div>

  );
}
