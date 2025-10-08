"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Withdrawal() {
  const [accountNumber, setAccountNumber] = useState("");
  const [customer, setCustomer] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [otherDetails, setOtherDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  // 🧠 Auto-search when user stops typing account number
  useEffect(() => {
    if (!accountNumber) {
      setCustomer(null);
      setMessage("");
      return;
    }

    if (typingTimeout) clearTimeout(typingTimeout);

    const timeout = setTimeout(() => {
      fetchCustomer(accountNumber);
    }, 1000); // wait 1 second after typing stops

    setTypingTimeout(timeout);
  }, [accountNumber]);

  // 🔍 Fetch customer details
  const fetchCustomer = async (accNum: string) => {
    try {
      setLoading(true);
      setMessage("");

      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("account_number", accNum)
        .single();

      if (error || !data) {
        setMessage("❌ Customer not found");
        setCustomer(null);
      } else {
        setCustomer(data);
        setMessage("");
      }
    } catch (err) {
      console.error(err);
      setMessage("Error fetching customer");
    } finally {
      setLoading(false);
    }
  };

  // 💸 Handle Withdrawal
  const handleWithdrawal = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!customer) return setMessage("Search for a valid customer first!");
    if (!amount) return setMessage("Enter withdrawal amount");

    try {
      setLoading(true);
      const withdrawValue = parseFloat(amount);
      const currentBalance = Number(customer.balance) || 0;

      if (withdrawValue > currentBalance) {
        setMessage("❌ Insufficient balance!");
        setLoading(false);
        return;
      }

      const newBalance = currentBalance - withdrawValue;

      const { error } = await supabase
        .from("customers")
        .update({ balance: newBalance })
        .eq("account_number", accountNumber);

      if (error) throw error;

      setCustomer({ ...customer, balance: newBalance });
      setMessage(`✅ ₦${amount} withdrawn successfully!`);
      setAmount("");
      setOtherDetails("");
    } catch (err) {
      console.error(err);
      setMessage("❌ Error processing withdrawal");
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
            <a href="/dashboard" className="ml-5">Dashboard</a>
            <a href="/newcustomer" className="ml-5">New Customer</a>
            <a href="/customer" className="ml-5">Existing Customers</a>
            <a href="/servicelist" className="ml-5">Service List</a>
            <a href="/Banking" className="ml-5">Banking</a>
            <a href="/Loan" className="ml-5">Loan</a>
            <a href="/Expenses" className="ml-5">Expenses</a>
            <a href="/reports" className="ml-5">Reports</a>
          </nav>
        </aside>

        {/* Main Section */}
        <main className="flex-1 p-6">
          <div className="flex items-center justify-center">
            <h2 className="text-3xl text-green-400 font-bold my-2">
              MIDDLECROWN MULTIVENTURES
            </h2>
          </div>

          <div className="h-[80vh] flex items-center justify-center">
            <form
              onSubmit={handleWithdrawal}
              className="flex items-center w-[50%] shadow-lg p-8 flex-col gap-5 rounded-xl"
            >
              <p className="text-xl text-green-400">Withdraw Funds</p>

              <div className="flex flex-col gap-5 w-full">
                <input
                  type="text"
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

                <div className="flex gap-3">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="border rounded-sm flex-1 h-10 pl-3"
                    placeholder="Enter Amount"
                  />
                  <input
                    type="text"
                    value={otherDetails}
                    onChange={(e) => setOtherDetails(e.target.value)}
                    className="border rounded-sm flex-1 h-10 pl-3"
                    placeholder="Other Details"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="border w-30 h-10 rounded-lg text-white bg-green-500 hover:scale-105 transition hover:bg-white hover:text-green-500 duration-300"
                disabled={loading}
              >
                {loading ? "Processing..." : "Withdraw"}
              </button>

              {message && (
                <p className="text-center text-sm mt-2 text-green-600">{message}</p>
              )}

              {customer && (
                <p className="text-sm text-gray-600">
                  Current Balance: ₦{Number(customer.balance).toLocaleString()}
                </p>
              )}
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
