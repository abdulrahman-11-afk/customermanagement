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
            <Link href="/servicelist" className="bg-green-400 w-40 flex items-center justify-center rounded-md h-10">Service List</Link>
            <Link href="/Banking" className="ml-5">Banking</Link>
            <Link href="/Loan" className="ml-5">Loan</Link>
            <Link href="/Expenses" className="ml-5">Expenses</Link>
            <Link href="/reports" className="ml-5">Reports</Link>
          </nav>
        </aside>
        <main className="flex-1 p-6 ">
          <div className="flex items-center justify-center">
            <h2 className="text-3xl cursor-pointer text-green-400 font-bold my-2"> MIDDLECROWN MULTIVENTURES</h2>
          </div>
          <div>
            <p className="text-xl pt-10 text-green-400">Add service list</p>
          </div>
          <div className="w-full flex items-center justify-center m-10">
            <button className="w-35 hover:scale-107 transition rounded-sm hover:text-white h-10 bg-green-400 hover:bg-green-500 ">Add Services</button>
          </div>
          <table className="min-w-full mt-10 border border-gray-300">
            <thead className="bg-green-500 text-white">
              <tr>
                <th className="border px-4 py-2">Service Name</th>
                <th className="border px-4 py-2">Charge</th>
                <th className="border px-4 py-2">Percentage</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><input className="border px-4 py-2 w-full focus:outline-none" type="text" /></td>
                <td><input className="border px-4 py-2 w-full focus:outline-none" type="text" /></td>
                <td><input className="border px-4 py-2 w-full focus:outline-none" type="text" /></td>
              </tr>
            </tbody>

          </table>

        </main>
      </div>
    </div>

  );
}
