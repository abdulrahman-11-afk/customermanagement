"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";

export default function NewRepayment() {
  const [accountNumber, setAccountNumber] = useState("");
  const [customer, setCustomer] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [otherDetails, setOtherDetails] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  // Auto-fetch customer by account number
  useEffect(() => {
    if (!accountNumber) {
      setCustomer(null);
      setMessage("");
      return;
    }

    if (typingTimeout) clearTimeout(typingTimeout);

    const timeout = setTimeout(() => {
      fetchCustomer(accountNumber);
    }, 1000);

    setTypingTimeout(timeout);
  }, [accountNumber]);

  const fetchCustomer = async (accNum: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("account_number", accNum)
        .single();

      if (error || !data) {
        setCustomer(null);
        setMessage("❌ Customer not found");
      } else {
        setCustomer(data);
        setMessage("");
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Error fetching customer");
    } finally {
      setLoading(false);
    }
  };

  // Submit repayment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return setMessage("Search for a valid customer first!");
    if (!amount) return setMessage("Enter repayment amount!");

    try {
      setLoading(true);
      const { error } = await supabase.from("repayments").insert([
        {
          account_number: accountNumber,
          customer_name: customer.name,
          amount: parseFloat(amount) || 0,
          other_details: otherDetails,
        },
      ]);

      if (error) throw error;

      setMessage("✅ Repayment added successfully!");
      setAccountNumber("");
      setCustomer(null);
      setAmount("");
      setOtherDetails("");
    } catch (err) {
      console.error(err);
      setMessage("❌ Error adding repayment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex">
        {/* Sidebar */}
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

        {/* Main content */}
        <main className="flex-1 p-6">
          <div className="flex items-center justify-center">
            <h2 className="text-3xl cursor-pointer text-green-400 font-bold my-2">
              MIDDLECROWN MULTIVENTURES
            </h2>
          </div>

          <div>
            <p className="text-xl pt-10 text-green-400">Add New Repayment</p>
          </div>

          <div className="h-[80vh] flex items-center justify-center">
            <form
              onSubmit={handleSubmit}
              className="flex items-center w-[50%] shadow-lg p-8 flex-col gap-5 rounded-xl"
            >
              <p className="text-xl text-green-400">New Repayment</p>

              <div className="flex flex-col gap-5 w-full">
                <input
                  type="text"
                  aria-label="paymentloan-account-number"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="border rounded-sm w-full h-10 pl-3"
                  placeholder="Enter Account Number"
                />

                <input
                  type="text"
                  value={customer ? customer.name : ""}
                  readOnly
                  className="border rounded-sm w-full h-10 pl-3 bg-gray-100"
                  placeholder="Customer Name"
                />

                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="border rounded-sm w-full h-10 pl-3"
                  placeholder="Enter Repayment Amount"
                />

                <input
                  type="text"
                  value={otherDetails}
                  onChange={(e) => setOtherDetails(e.target.value)}
                  className="border rounded-sm w-full h-10 pl-3"
                  placeholder="Other Details"
                />
              </div>

              <button
                type="submit"
                aria-label="paymentloan-submit"
                disabled={loading}
                className="border w-30 h-10 rounded-lg text-white bg-green-500 hover:scale-105 transition hover:bg-white hover:text-green-500 duration-300"
              >
                {loading ? "Processing..." : "Submit"}
              </button>

              {message && (
                <p className="text-sm mt-2 text-green-600 text-center">{message}</p>
              )}
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
