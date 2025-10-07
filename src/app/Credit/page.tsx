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
            <Link href="/reports" className="ml-5">Reports</Link>
          </nav>
        </aside>
        <main className="flex-1 p-6 ">
          <div className="flex items-center justify-center">
            <h2 className="text-3xl cursor-pointer text-green-400 font-bold my-2"> MIDDLECROWN MULTIVENTURES</h2>
          </div>
          <div className="h-[80vh] flex items-center width-full justify-center">
            <form className="flex items-center w-[50%] shadow-lg h-80 flex-col gap-5">
              <p className="text-xl pt-10 text-green-400">Add Deposit</p>
              <div className="flex gap-5 flex-col my-5">
                <div className="flex gap-5">
                  <input inputMode="numeric" className="border rounded-sm w-50 h-10 pl-3" type="text" placeholder="Enter Account Number" />
                  <input type="text" className="border rounded-sm w-50 h-10 pl-3" placeholder="Customer Name" />
                </div>
                <div className="gap-5 flex">
                  <input type="text" className="border rounded-sm w-50 h-10 pl-3" placeholder="Enter Amount" />
                  <input type="text" className="border rounded-sm w-50 h-10 pl-3" placeholder="Other details" />
                </div>
              </div>
              <button className="border w-30 h-10 rounded-lg text-white bg-green-500 hover:scale-107 transition hover:bg-white hover:text-green-500 duration-300 ">Submit</button>
            </form>
          </div>
        </main>

      </div>
    </div>

  );
}
