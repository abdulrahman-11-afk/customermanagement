"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Dashboard() {


  return (
    <div className="flex flex-col h-screen">
      <div className="flex ">
        <aside className="w-64 bg-gray-100 flex h-[100vh] flex-col pt-22 p-4">
          <nav className="flex flex-col gap-7">
            <Link href="/dashboard" className="ml-5">Dashboard</Link>
            <Link href="/newcustomer" className="ml-5">New Customer</Link>
            <Link href="/customer" className="ml-5">Existing Customers</Link>
            <Link href="/servicelist" className="ml-5">Service List</Link>
            <Link href="/Banking" className="ml-5">Banking</Link>
            <Link href="/Loan" className="ml-5">Loan</Link>
            <Link href="/Expenses" className="ml-5">Expenses</Link>
            <Link href="/reports" className="bg-green-400 w-40 flex items-center justify-center rounded-md h-10">Reports</Link>
          </nav>
        </aside>
        <main className="flex-1 p-6 ">
          <div className="flex items-center justify-center">
            <h2 className="text-3xl cursor-pointer text-green-400 font-bold my-2"> MIDDLECROWN MULTIVENTURES</h2>
          </div>
          <div>
            <p className="text-xl pt-10 text-green-400">Reports</p>
          </div>
          <div className="flex items-center justify-evenly mt-20">
            <div className="w-50 text-center hover:scale-107 transition ease-in duration-200 hover:bg-green-400 flex flex-col justify-between h-40 rounded-lg p-3 bg-green-300">
              <p>Get Banking Summary</p>
              <p>Get Customer Transaction History</p>
            </div>
            <div className="w-50 text-center hover:scale-107 transition ease-in duration-200 hover:bg-green-400 flex flex-col justify-between h-40 rounded-lg p-3 bg-green-300">
              <p>Get Loan Summary</p>
              <p>Get Customer Loan History</p>
            </div>
            <div className="w-50 text-center hover:scale-107 transition ease-in duration-200 hover:bg-green-400 flex flex-col justify-between h-40 rounded-lg p-3 bg-green-300">
              <p>Income Report</p>
              <p>Get Monthly Income Summary</p>
            </div>
            <div className="w-50 text-center hover:scale-107 transition ease-in duration-200 hover:bg-green-400 flex flex-col justify-between h-40 rounded-lg p-3 bg-green-300">
              <p>Expense Report</p>
              <p>Get Monthly Expense Summary</p>
            </div>
            <div className="w-50 text-center hover:scale-107 transition ease-in duration-200 hover:bg-green-400 flex flex-col justify-between h-40 rounded-lg p-3 bg-green-300">
              <p>Profit and loss statement</p>
              <p>Get Monthly Income, Expense, Cost Summary</p>
            </div>
          </div>
        </main>

      </div>
    </div>

  );
}
