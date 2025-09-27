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
        <aside className="w-64 bg-gray-100 flex h-[100vh] flex-col pt-22 p-4">
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
            <h2 className="text-3xl cursor-pointer text-green-400 font-bold my-2"> MIDDLECROWN MULTIVENTURES</h2>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xl font-semibold">Dashboard</p>
            <input type="text" className="border-2 pl-2 color-green-400 border-green-400 w-60 rounded-md placeholder:text-green-400 focus:outline-none h-10" placeholder="Search customer" />
          </div>
          <div className="pt-10">
            <h1 className="text-2xl font-bold text-gray-800">Welcome Admin </h1>
            <p>Select a menu item from the sidebar to get started.</p>
          </div>
          <div className="h-100">
        {/* <iframe
         src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3959.2855731645514!2d3.8122453147757996!3d7.363264994709648!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1039ec5004a58a4f%3A0xd2a305c2d8e1af82!2sApata%20Market%2C%20Ibadan!5e0!3m2!1sen!2sng!4v1695802000000!5m2!1sen!2sng"
        width="50%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      ></iframe> */}

          </div>
        </main>

      </div>
    </div>

  );
}
