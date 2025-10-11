"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";

interface Loan {
  id: number;
  account_number: string;
  customer_name: string;
  loan_type: string;
  amount: number;
  interest_rate: number;
  total_amount: number;
  status: string;
  other_details: string;
  created_at: string;
}

export default function Loan() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const fetchLoansWithNames = async () => {
    try {
      // Fetch all loans
      const { data: loansData, error: loansError } = await supabase
        .from("loans")
        .select("*")
        .order("id", { ascending: false });

      if (loansError) throw loansError;

      // Fetch all customers (check your customer table column names)
      const { data: customersData, error: customersError } = await supabase
        .from("customers")
        .select("account_number, name"); // or use "customer_name" if that's your column

      if (customersError) throw customersError;

      // Merge: match account_number between loans and customers
      const loansWithNames = loansData.map((loan) => {
        const customer = customersData.find(
          (c) => c.account_number === loan.account_number
        );
        return {
          ...loan,
          customer_name: customer ? customer.name : "Unknown",
        };
      });

      setLoans(loansWithNames);
    } catch (err) {
      console.error("Error loading loans:", err);
    } finally {
      setLoading(false);
    }
  };

  fetchLoansWithNames();
}, []);


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
            <Link href="/Loan" className="bg-green-400 w-40 flex items-center justify-center rounded-md h-10">Loan</Link>
            <Link href="/Expenses" className="ml-5">Expenses</Link>
            <Link href="/reports" className="ml-5">Reports</Link>
          </nav>
        </aside>

        <main className="flex-1 p-6 ">
          <div className="flex items-center justify-center">
            <h2 className="text-3xl cursor-pointer text-green-400 font-bold my-2">
              MIDDLECROWN MULTIVENTURES
            </h2>
          </div>

          <div>
            <div className="flex items-center justify-center gap-x-30 my-7">
              <Link href="/NewLoan">
                <div className="w-40 bg-green-400 cursor-pointer transform hover:scale-105 transition ease duration-300 hover:bg-green-500 text-white h-20 rounded-lg flex items-center justify-center text-lg">
                  <p>New Loan</p>
                </div>
              </Link>

              <Link href="/Payment">
                <div className="w-40 bg-green-400 transform hover:scale-105 transition ease duration-300 hover:bg-green-500 text-white h-20 rounded-lg flex items-center justify-center text-lg">
                  <p>Payment</p>
                </div>
              </Link>
            </div>

            <table className="min-w-full border border-gray-100">
              <thead className="bg-green-400 text-white">
                <tr>
                  <th className="border px-4 py-2">Customer Name</th>
                  <th className="border px-4 py-2">Loan Type</th>
                  <th className="border px-4 py-2">Amount (₦)</th>
                  <th className="border px-4 py-2">Interest (%)</th>
                  <th className="border px-4 py-2">Total Payable (₦)</th>
                  <th className="border px-4 py-2">Status</th>
                  <th className="border px-4 py-2">Account Number</th>
                  <th className="border px-4 py-2">Other Details</th>
                  <th className="border px-4 py-2">Date</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-4 text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : loans.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-4 text-gray-500">
                      No loan records found
                    </td>
                  </tr>
                ) : (
                  loans.map((loan) => (
                    <tr key={loan.id} className="text-center border">
                     <td className="border px-4 py-2">{loan.customer_name}</td>
                      <td className="border px-4 py-2">{loan.loan_type}</td>
                      <td className="border px-4 py-2">₦{Number(loan.amount || 0).toLocaleString()}</td>
                      <td className="border px-4 py-2">{Number(loan.interest_rate || 0)}</td>
                      <td className="border px-4 py-2">₦{Number(loan.total_amount || 0).toLocaleString()}</td>
                      <td className="border px-4 py-2">{loan.status}</td>
                      <td className="border px-4 py-2">{loan.account_number}</td>
                      <td className="border px-4 py-2">{loan.other_details}</td>
                      <td className="border px-4 py-2">
                        {new Date(loan.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
