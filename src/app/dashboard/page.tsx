"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    const isAuth = localStorage.getItem("isAuth");
    if (!isAuth) {
      router.push("/login");
    }
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <div className="flex ">
        <aside className="w-64 bg-gray-100 h-[100vh] hidden md:flex flex-col pt-22 p-4">
          <nav className="flex flex-col gap-7">
            <Link href="/dashboard" className="bg-green-400 w-40 flex items-center justify-center rounded-md h-10">Dashboard</Link>
            <Link href="/newcustomer" className="ml-5">New Customer</Link>
            <Link href="/customer" className="ml-5">Existing Customers</Link>
            <Link href="/servicelist" className="ml-5">Service List</Link>
            <Link href="/Banking" className="ml-5">Banking</Link>
            <Link href="/Loan" className="ml-5">Loan</Link>
            <Link href="/Expenses" className="ml-5">Expenses</Link>
            <Link href="/reports" className="ml-5">Reports</Link>
          </nav>
          <div className="ml-5 pt-30"><Link href="/login" >Logout</Link></div>
        </aside>
        <main className="flex-1 p-6 ">
          <div className="flex items-center justify-center">
            <h2 className="md:text-3xl text-lg cursor-pointer text-green-400 font-bold my-2"> MIDDLECROWN MULTIVENTURES</h2>
          </div>
          <div className="flex items-center g-5 justify-between">
            <p className="md:text-xl text-lg font-semibold">Dashboard</p>
            <input type="text" className="border-2 pl-2 color-green-400 border-green-400 w-40 md:w-60 rounded-md placeholder:text-md placeholder:text-green-400 focus:outline-none h-7 md:h-10" placeholder="Search customer" />
          </div>
          <div className="pt-10">
            <h1 className="text-2xl font-bold text-gray-800">Welcome Admin </h1>
            <p>Select a menu item from the sidebar to get started.</p>
          </div>  
        </main>

      </div>
    </div>

  );
}
