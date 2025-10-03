"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";

interface Customer {
  id: number;
  name: string;
  phone: string;
  account_number: string;
  balance: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filtered, setFiltered] = useState<Customer[]>([]);

  useEffect(() => {
    const isAuth = localStorage.getItem("isAuth");
    if (!isAuth) {
      router.push("/login");
    }
  }, []);

  // fetch all customers
  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .from("customers")
      .select("id, name, phone, account_number, balance");
    if (error) console.error(error);
    else setCustomers(data || []);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // filter as user types
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFiltered([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    setFiltered(
      customers.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.account_number.toLowerCase().includes(q)
      )
    );
  }, [searchQuery, customers]);

  return (
    <div className="flex flex-col h-screen">
      <div className="flex">
        {/* Sidebar */}
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
          <div className="ml-5 pt-30"><Link href="/login">Logout</Link></div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="flex items-center justify-center">
            <h2 className="md:text-3xl text-lg cursor-pointer text-green-400 font-bold my-2">
              MIDDLECROWN MULTIVENTURES
            </h2>
          </div>

          {/* Search */}
          <div className="flex items-center g-5 justify-between relative">
            <p className="md:text-xl text-lg font-semibold">Dashboard</p>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-2 pl-2 border-green-400 w-40 md:w-60 rounded-md placeholder:text-md placeholder:text-green-400 focus:outline-none h-7 md:h-10"
                placeholder="Search customer"
              />
              {filtered.length > 0 && (
                <div className="absolute bg-white border border-gray-300 mt-1 w-full rounded-md shadow-lg max-h-60 overflow-y-auto z-50">
                  {filtered.map((customer) => (
                    <Link
                      key={customer.id}
                      href={`/customer/${customer.id}`} 
                      className="block px-3 py-2 hover:bg-green-100 cursor-pointer"
                    >
                      <span className="font-semibold">{customer.name}</span>
                      <br />
                      <span className="text-sm text-gray-600">
                        {customer.account_number} | {customer.phone} | ₦{customer.balance.toFixed(2)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
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
