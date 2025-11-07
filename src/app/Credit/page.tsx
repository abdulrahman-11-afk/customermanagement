"use client";

import React, { useEffect, useRef, useState } from "react";
import { getSupabase } from "../lib/supabaseClient";

interface Customer {
  id: number;
  name: string;
  account_number: string;
  balance: number | string | null;
  // add other customer fields if any
}

interface TransactionRow {
  id?: number;
  type: string;
  amount: number;
  description?: string | null;
  created_at?: string;
  customer_id?: number;
}

export default function Credit() {
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [otherDetails, setOtherDetails] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");
  const [txColumns, setTxColumns] = useState<string[] | null>(null);
  const [lastInsertError, setLastInsertError] = useState<any>(null);

  // useRef for debounce timer (works in browser)
  const typingTimer = useRef<number | null>(null);

  // Debounced fetch for accountNumber
  useEffect(() => {
    if (!accountNumber) {
      setCustomer(null);
      setMessage("");
      setLastInsertError(null);
      return;
    }

    // clear previous timer
    if (typingTimer.current) window.clearTimeout(typingTimer.current);

    typingTimer.current = window.setTimeout(() => {
      fetchCustomer(accountNumber);
    }, 1000);

    // cleanup on unmount or accountNumber change
    return () => {
      if (typingTimer.current) {
        window.clearTimeout(typingTimer.current);
        typingTimer.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountNumber]);

  // fetch a customer by account number
  const fetchCustomer = async (accNum: string) => {
    try {
      setLoading(true);
      setMessage("");
      const supabase = getSupabase();
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("account_number", accNum)
        .single();

      if (error || !data) {
        setCustomer(null);
        setMessage("❌ Customer not found");
        setMessageType("error");
      } else {
        setCustomer(data);
        setMessage("");
      }
    } catch (err) {
      console.error("fetchCustomer error:", err);
      setMessage("❌ Error fetching customer");
      setMessageType("error");
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  };

  // validate amount
  const validateAmount = (value: string) => {
    const n = Number(value);
    if (!value) return "Enter deposit amount";
    if (Number.isNaN(n)) return "Enter a valid number";
    if (n <= 0) return "Amount must be greater than zero";
    return null;
  };

  // handle deposit: update customers.balance then insert transaction row
  const handleDeposit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLastInsertError(null);

    if (!customer) {
      setMessage("🔎 Search for a valid customer first!");
      setMessageType("error");
      return;
    }

    const validationError = validateAmount(amount);
    if (validationError) {
      setMessage(`❌ ${validationError}`);
      setMessageType("error");
      return;
    }

    const depositValue = parseFloat(amount);
    const currentBalance = Number(customer.balance) || 0;
    const newBalance = currentBalance + depositValue;

    try {
      setLoading(true);
      setMessage("Processing...");
      setMessageType("info");

      // 1) Update customer balance
      const supabase = getSupabase();
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      const { error: balanceError } = await supabase
        .from("customers")
        .update({ balance: newBalance })
        .eq("account_number", customer.account_number);

      if (balanceError) {
        console.error("Balance update error:", balanceError);
        throw balanceError;
      }

      // 2) Insert transaction row using your schema (customer_id)
      const txPayload: TransactionRow = {
        customer_id: customer.id,
        type: "credit",
        amount: depositValue,
        description: otherDetails || null,
        created_at: new Date().toISOString(),
      };

      const { error: txError } = await supabase.from("transactions").insert(txPayload);

      if (txError) {
        // insertion failed — attempt rollback of the balance update
        console.error("Transaction insert error:", txError);
        setLastInsertError(txError);

        // Try to rollback customer balance
        try {
          const { error: rollbackError } = await supabase
            .from("customers")
            .update({ balance: currentBalance })
            .eq("account_number", customer.account_number);

          if (rollbackError) {
            console.error("Rollback failed:", rollbackError);
            setMessage("❌ Transaction failed and rollback failed (see console).");
            setMessageType("error");
            throw txError; // surface original tx error up
          } else {
            setMessage("❌ Transaction failed. Balance rolled back.");
            setMessageType("error");
            throw txError;
          }
        } catch (rbErr) {
          console.error("Rollback exception:", rbErr);
          setMessage("❌ Transaction failed and rollback exception occurred (see console).");
          setMessageType("error");
          throw txError;
        }
      }

      // success
      setCustomer({ ...customer, balance: newBalance });
      setAmount("");
      setOtherDetails("");
      setMessage(`✅ ₦${depositValue.toLocaleString()} added successfully!`);
      setMessageType("success");

      // auto-hide success after 5s
      window.setTimeout(() => {
        setMessage("");
      }, 5000);
    } catch (err) {
      console.error("handleDeposit error:", err);
      if (!message) {
        setMessage("❌ Error adding deposit (see console).");
        setMessageType("error");
      }
    } finally {
      setLoading(false);
    }
  };

  // Debug helper: fetch one transaction row to inspect column names
  const fetchTransactionColumns = async () => {
    try {
      setLoading(true);
      setMessage("");
      const supabase = getSupabase();
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      const { data, error } = await supabase.from("transactions").select("*").limit(1);

      if (error) {
        console.error("Error fetching transactions for schema check:", error);
        setMessage("❌ Error fetching transactions (see console)");
        setTxColumns(null);
        setMessageType("error");
        return;
      }

      if (!data || data.length === 0) {
        setTxColumns([]);
        setMessage("No transactions found to inspect columns");
        setMessageType("info");
        return;
      }

      setTxColumns(Object.keys(data[0]));
      setMessage("Transaction columns fetched");
      setMessageType("info");
    } catch (e) {
      console.error(e);
      setMessage("❌ Unexpected error (see console)");
      setMessageType("error");
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
              onSubmit={handleDeposit}
              className="flex items-center w-[50%] shadow-lg p-8 flex-col gap-5 rounded-xl"
            >
              <p className="text-xl text-green-400">Add Deposit</p>

              <div className="flex flex-col gap-5 w-full">
                <input
                  type="text"
                  aria-label="credit-account-number"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.trim())}
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
                    type="text"
                    aria-label="credit-amount"
                    value={
                      amount
                        ? Number(amount.toString().replace(/,/g, "")).toLocaleString()
                        : ""
                    }
                    onChange={(e) => {
                      const raw = e.target.value.replace(/,/g, "");
                      if (!/^\d*\.?\d*$/.test(raw)) return; // allow only numbers and one dot
                      setAmount(raw);
                    }}
                    className="border rounded-sm flex-1 h-10 pl-3"
                    placeholder="Enter Amount"
                  />

                  <input
                    type="text"
                    value={otherDetails}
                    onChange={(e) => setOtherDetails(e.target.value)}
                    className="border rounded-sm flex-1 h-10 pl-3"
                    placeholder="Other Details (optional)"
                  />
                </div>
              </div>

              <button
                type="submit"
                aria-label="credit-submit"
                className={`border w-30 h-10 rounded-lg text-white bg-green-500 hover:scale-105 transition duration-300 ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
                disabled={loading || !customer || !!validateAmount(amount)}
              >
                {loading ? "Processing..." : "Submit"}
              </button>



              {message && (
                <p className={`text-center text-sm mt-2 ${messageType === "success" ? "text-green-600" : "text-red-600"}`}>
                  {message}
                </p>
              )}



              {customer && (
                <p className="text-sm text-gray-600">
                  Current Balance: ₦{Number(customer.balance || 0).toLocaleString()}
                </p>
              )}
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
