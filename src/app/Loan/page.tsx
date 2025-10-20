"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";

interface Loan {
  id: number;
  account_number: string;
  name: string;
  loan_type: string;
  amount: number;
  interest_rate: number;
  total_amount: number;
  status: string;
  other_details: string;
  balance?: number;
  created_at: string;
}

export default function Loan() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    const fetchLoansWithNames = async () => {
      try {
        // Fetch all loans
        const { data: loansData, error: loansError } = await supabase
          .from("loans")
          .select("*")
          .order("id", { ascending: false });

        if (loansError) throw loansError;

        // Fetch customers
        const { data: customersData, error: customersError } = await supabase
          .from("customers")
          .select("account_number, name");

        if (customersError) throw customersError;

        // Fetch repayments
        let repaymentsData: any[] = [];
        try {
          const { data, error } = await supabase
            .from("repayments")
            .select("*")
            .order("created_at", { ascending: false });
          if (!error && data) repaymentsData = data;
        } catch {
          repaymentsData = [];
        }

        // Calculate total repayments per account
        const repaymentsMap: Record<string, number> = {};
        repaymentsData.forEach((r: any) => {
          const acc = r.account_number ?? r.accountNumber ?? "";
          const amt = Number(r.amount) || 0;
          if (!acc) return;
          repaymentsMap[acc] = (repaymentsMap[acc] || 0) + Math.abs(amt);
        });

        // Merge loans with customer names and balances
        const loansWithNames = loansData.map((loan) => {
          const customer = customersData.find(
            (c) => c.account_number === loan.account_number
          );
          const base = Number(loan.total_amount ?? loan.amount ?? 0);
          const repaid = repaymentsMap[loan.account_number] || 0;
          return {
            ...loan,
            name: customer ? customer.name : "Unknown",
            balance: Math.max(0, base - repaid),
          };
        });

        // Build table rows (loan + repayments)
        const newRows: any[] = [];
        loansWithNames.forEach((loan) => {
          // Loan row
          newRows.push({
            rowType: "loan",
            uniqueKey: `loan-${loan.id}-${loan.account_number}`,
            ...loan,
          });

          // Related repayments
          const reps = repaymentsData.filter(
            (r) =>
              (r.account_number ?? r.accountNumber) === loan.account_number
          );
          reps.forEach((r) => {
            newRows.push({
              rowType: "repayment",
              uniqueKey: `repayment-${r.id || Math.random()}-${loan.account_number}`,
              account_number: loan.account_number,
              name: loan.name,
              amount: Number(r.amount) || 0,
              details: r.other_details ?? r.note ?? "",
              created_at: r.created_at ?? r.createdAt ?? null,
            });
          });
        });

        setLoans(loansWithNames);
        setRows(newRows);
      } catch (err) {
        console.error("Error loading loans:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLoansWithNames();
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "—";
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-100 flex h-[100vh] flex-col pt-22 p-4">
          <nav className="flex flex-col gap-7">
            <Link href="/dashboard" className="ml-5">
              Dashboard
            </Link>
            <Link href="/newcustomer" className="ml-5">
              New Customer
            </Link>
            <Link href="/customer" className="ml-5">
              Existing Customers
            </Link>
            <Link href="/servicelist" className="ml-5">
              Service List
            </Link>
            <Link href="/Banking" className="ml-5">
              Banking
            </Link>
            <Link
              href="/Loan"
              className="bg-green-400 w-40 flex items-center justify-center rounded-md h-10"
            >
              Loan
            </Link>
            <Link href="/Expenses" className="ml-5">
              Expenses
            </Link>
            <Link href="/reports" className="ml-5">
              Reports
            </Link>
          </nav>
        </aside>

        {/* Main Section */}
        <main className="flex-1 p-6">
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

              <Link href="/PaymentLoan">
                <div className="w-40 bg-green-400 transform hover:scale-105 transition ease duration-300 hover:bg-green-500 text-white h-20 rounded-lg flex items-center justify-center text-lg">
                  <p>Payment</p>
                </div>
              </Link>
            </div>

            {/* Table */}
            <table className="min-w-full border border-gray-100">
              <thead className="bg-green-400 text-white">
                <tr>
                  <th className="border px-4 py-2">Customer Name</th>
                  <th className="border px-4 py-2">Loan Type</th>
                  <th className="border px-4 py-2">Amount (₦)</th>
                  <th className="border px-4 py-2">Balance (₦)</th>
                  <th className="border px-4 py-2">Interest (%)</th>
                  <th className="border px-4 py-2">Total Payable (₦)</th>
                  <th className="border px-4 py-2">Status</th>
                  <th className="border px-4 py-2">Account Number</th>
                  <th className="border px-4 py-2">Other Details</th>
                  <th className="border px-4 py-2">Date</th>
                  <th className="border px-4 py-2">Type</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={11} className="text-center py-4 text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : loans.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-4 text-gray-500">
                      No loan records found
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr
                      key={r.uniqueKey}
                      className={`text-center border ${
                        r.rowType === "repayment" ? "bg-gray-50" : ""
                      }`}
                    >
                      {r.rowType === "loan" ? (
                        <>
                          <td className="border px-4 py-2 flex items-center justify-center gap-2">
                            {r.name}
                          </td>
                          <td className="border px-4 py-2">{r.loan_type}</td>
                          <td className="border px-4 py-2">
                            ₦{Number(r.amount || 0).toLocaleString()}
                          </td>
                          <td className="border px-4 py-2">
                            ₦{Number(r.balance || 0).toLocaleString()}
                          </td>
                          <td className="border px-4 py-2">
                            {Number(r.interest_rate || 0)}
                          </td>
                          <td className="border px-4 py-2">
                            ₦{Number(r.total_amount || 0).toLocaleString()}
                          </td>
                          <td className="border px-4 py-2">{r.status}</td>
                          <td className="border px-4 py-2">
                            {r.account_number}
                          </td>
                          <td className="border px-4 py-2">
                            {r.other_details ?? "—"}
                          </td>
                          <td className="border px-4 py-2">
                            {formatDate(r.created_at)}
                          </td>
                          <td className="border px-4 py-2">Loan</td>
                        </>
                      ) : (
                        <>
                          <td className="border px-4 py-2">{r.name}</td>
                          <td className="border px-4 py-2">—</td>
                          <td className="border px-4 py-2">
                            ₦{Number(r.amount || 0).toLocaleString()}
                          </td>
                          <td className="border px-4 py-2">—</td>
                          <td className="border px-4 py-2">—</td>
                          <td className="border px-4 py-2">—</td>
                          <td className="border px-4 py-2">—</td>
                          <td className="border px-4 py-2">
                            {r.account_number}
                          </td>
                          <td className="border px-4 py-2">
                            {r.details ?? "—"}
                          </td>
                          <td className="border px-4 py-2">
                            {formatDate(r.created_at)}
                          </td>
                          <td className="border px-4 py-2">Repayment</td>
                        </>
                      )}
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
