"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getSupabase } from "../lib/supabaseClient";

type Repayment = {
  id?: number;
  account_number?: string;
  amount: number;
  other_details?: string;
  created_at?: string | null;
};

type Loan = {
  id: number;
  account_number: string;
  name: string;
  loan_type: string;
  amount: number;
  interest_rate: number;
  total_amount: number;
  status: string;
  other_details?: string;
  balance?: number;
  created_at?: string | null;
  repayments?: Repayment[];
};

export default function Loan() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLoanIds, setExpandedLoanIds] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const supabase = getSupabase();
        if (!supabase) throw new Error("Supabase client not available");

        const { data: loansData, error: loansError } = await supabase.from("loans").select("*").order("id", { ascending: false });
        if (loansError) throw loansError;

        const { data: customersData, error: customersError } = await supabase.from("customers").select("account_number, name");
        if (customersError) throw customersError;

        const { data: repsData, error: repsError } = await supabase.from("repayments").select("*").order("created_at", { ascending: false });
        const repaymentsData = repsError || !repsData ? [] : repsData;

        const mapped: Loan[] = (loansData || []).map((loan: any) => {
          const customer = (customersData || []).find((c: any) => c.account_number === loan.account_number);
          const related: Repayment[] = (repaymentsData || [])
            .filter((r: any) => (r.account_number ?? r.accountNumber) === loan.account_number)
            .map((r: any) => ({
              id: r.id,
              account_number: r.account_number ?? r.accountNumber,
              amount: Number(r.amount) || 0,
              other_details: r.other_details ?? r.note ?? "",
              created_at: r.created_at ?? r.createdAt ?? null,
            }));

          const totalBase = Number(loan.total_amount ?? loan.amount ?? 0);
          const repaid = related.reduce((s, x) => s + Math.abs(x.amount), 0);

          return {
            ...loan,
            name: customer ? customer.name : "Unknown",
            balance: Math.max(0, totalBase - repaid),
            repayments: related,
          };
        });

        setLoans(mapped);
      } catch (err) {
        console.error("Error loading loans:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const formatDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString() : "—");

  return (
    <div className="flex flex-col h-screen">
      <div className="flex">
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

        <main className="flex-1 p-6">
          <div className="flex items-center justify-center">
            <h2 className="text-3xl text-green-400 font-bold my-2">MIDDLECROWN MULTIVENTURES</h2>
          </div>

          <div>
            <div className="flex items-center justify-center gap-x-30 my-7">
              <Link href="/NewLoan"><div className="w-40 bg-green-400 cursor-pointer h-20 rounded-lg flex items-center justify-center text-lg text-white">New Loan</div></Link>
              <Link href="/PaymentLoan"><div className="w-40 bg-green-400 cursor-pointer h-20 rounded-lg flex items-center justify-center text-lg text-white">Payment</div></Link>
            </div>

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
                  <tr><td colSpan={11} className="text-center py-4">Loading...</td></tr>
                ) : loans.length === 0 ? (
                  <tr><td colSpan={11} className="text-center py-4 text-gray-500">No loan records found</td></tr>
                ) : (
                  loans.map((loan) => (
                    <React.Fragment key={loan.id}>
                      <tr className="text-center border">
                        <td className="border px-4 py-2 flex items-center justify-center gap-2">
                          <div className="flex items-center gap-2">
                            <button onClick={() => setExpandedLoanIds(s => ({ ...s, [loan.id]: !s[loan.id] }))} className="text-sm bg-gray-200 px-2 rounded">{expandedLoanIds[loan.id] ? '-' : '+'}</button>
                            <span>{loan.name}</span>
                          </div>
                        </td>
                        <td className="border px-4 py-2">{loan.loan_type}</td>
                        <td className="border px-4 py-2">₦{Number(loan.amount || 0).toLocaleString()}</td>
                        <td className="border px-4 py-2">₦{Number(loan.balance || 0).toLocaleString()}</td>
                        <td className="border px-4 py-2">{Number(loan.interest_rate || 0)}</td>
                        <td className="border px-4 py-2">₦{Number(loan.total_amount || 0).toLocaleString()}</td>
                        <td className="border px-4 py-2">{loan.status}</td>
                        <td className="border px-4 py-2">{loan.account_number}</td>
                        <td className="border px-4 py-2">{loan.other_details ?? '—'}</td>
                        <td className="border px-4 py-2">{formatDate(loan.created_at)}</td>
                        <td className="border px-4 py-2">Loan</td>
                      </tr>

                      {expandedLoanIds[loan.id] && (
                        <tr className="bg-gray-50">
                          <td colSpan={11} className="p-3 text-left">
                            <div className="text-sm font-semibold mb-2">Repayment History</div>
                            {loan.repayments && loan.repayments.length ? (
                              <table className="w-full text-xs">
                                <thead>
                                  <tr>
                                    <th className="text-left">Date</th>
                                    <th className="text-left">Amount</th>
                                    <th className="text-left">Details</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {loan.repayments!.map((r) => (
                                    <tr key={r.id || Math.random()}>
                                      <td>{formatDate(r.created_at)}</td>
                                      <td>₦{Number(r.amount || 0).toLocaleString()}</td>
                                      <td>{r.other_details || '—'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <div className="text-xs text-gray-500">No repayments yet.</div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
