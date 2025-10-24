"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "../lib/supabaseClient";

interface Loan {
  id: number;
  account_number: string;
  name: string;
  amount: number;
  total_amount: number;
  status: string;
  created_at: string;
}

interface Repayment {
  id: number;
  account_number: string;
  amount: number;
  created_at: string;
}

export default function LoanReport() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [repayments, setRepayments] = useState<Repayment[]>([]);
  const [monthlyLoans, setMonthlyLoans] = useState<Loan[]>([]);
  const [monthlyRepayments, setMonthlyRepayments] = useState<Repayment[]>([]);
  const [monthlyLoan, setMonthlyLoan] = useState(0);
  const [monthlyRepay, setMonthlyRepay] = useState(0);
  const [yearlyLoan, setYearlyLoan] = useState(0);
  const [yearlyRepay, setYearlyRepay] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = getSupabase();
      if (!supabase) {
        console.error("Supabase client not found");
        return;
      }

      const { data: loanData, error: loanError } = await supabase
        .from("loans")
        .select("*");

      const { data: repayData, error: repayError } = await supabase
        .from("repayments")
        .select("*");

      if (loanError || repayError) {
        console.error(loanError || repayError);
        return;
      }

      setLoans(loanData || []);
      setRepayments(repayData || []);
      calculateTotals(loanData || [], repayData || []);
    };

    fetchData();
  }, []);

  const calculateTotals = (loanData: Loan[], repayData: Repayment[]) => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const monthlyLoanRecords = loanData.filter(
      (loan) =>
        new Date(loan.created_at).getMonth() === thisMonth &&
        new Date(loan.created_at).getFullYear() === thisYear
    );

    const monthlyRepayRecords = repayData.filter(
      (repay) =>
        new Date(repay.created_at).getMonth() === thisMonth &&
        new Date(repay.created_at).getFullYear() === thisYear
    );

    const monthlyLoanTotal = monthlyLoanRecords.reduce(
      (sum, loan) => sum + loan.amount,
      0
    );

    const yearlyLoanTotal = loanData
      .filter((loan) => new Date(loan.created_at).getFullYear() === thisYear)
      .reduce((sum, loan) => sum + loan.amount, 0);

    const monthlyRepayTotal = monthlyRepayRecords.reduce(
      (sum, repay) => sum + repay.amount,
      0
    );

    const yearlyRepayTotal = repayData
      .filter((repay) => new Date(repay.created_at).getFullYear() === thisYear)
      .reduce((sum, repay) => sum + repay.amount, 0);

    setMonthlyLoans(monthlyLoanRecords);
    setMonthlyRepayments(monthlyRepayRecords);
    setMonthlyLoan(monthlyLoanTotal);
    setYearlyLoan(yearlyLoanTotal);
    setMonthlyRepay(monthlyRepayTotal);
    setYearlyRepay(yearlyRepayTotal);
  };

  const getTotalRepaidByAccount = (accountNumber: string) => {
    return monthlyRepayments
      .filter((r) => r.account_number === accountNumber)
      .reduce((sum, r) => sum + r.amount, 0);
  };

  const formatCurrency = (num: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(num);

  const monthName = new Date().toLocaleString("default", { month: "long" });

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
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="flex items-center justify-center">
            <h2 className="text-3xl text-green-500 font-bold mb-6">
              Loan Summary Report
            </h2>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <div className="bg-green-100 p-4 rounded-lg border">
              <h2 className="text-sm text-gray-500">
                Total Loaned (This Month)
              </h2>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(monthlyLoan)}
              </p>
            </div>

            <div className="bg-red-100 p-4 rounded-lg border">
              <h2 className="text-sm text-gray-500">
                Total Repaid (This Month)
              </h2>
              <p className="text-xl font-bold text-red-600">
                {formatCurrency(monthlyRepay)}
              </p>
            </div>

            <div className="bg-green-100 p-4 rounded-lg border">
              <h2 className="text-sm text-gray-500">Total Loaned (This Year)</h2>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(yearlyLoan)}
              </p>
            </div>

            <div className="bg-red-100 p-4 rounded-lg border">
              <h2 className="text-sm text-gray-500">Total Repaid (This Year)</h2>
              <p className="text-xl font-bold text-red-600">
                {formatCurrency(yearlyRepay)}
              </p>
            </div>
          </div>

          {/* Loan & Repayment History (Current Month) */}
          <div className="bg-white p-4 rounded-lg border">
            <h2 className="text-lg font-semibold mb-4 text-gray-700">
              Loan and Repayment History — {monthName}
            </h2>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Account No.</th>
                    <th className="px-4 py-2 text-left">Loan Amount</th>
                    <th className="px-4 py-2 text-left">Total Payable</th>
                    <th className="px-4 py-2 text-left">Total Repaid</th>
                    <th className="px-4 py-2 text-left">Balance</th>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyLoans.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-4 text-gray-500">
                        No loan records for {monthName}.
                      </td>
                    </tr>
                  ) : (
                    monthlyLoans.map((loan) => {
                      const totalRepaid = getTotalRepaidByAccount(loan.account_number);
                      const balance = loan.total_amount - totalRepaid;

                      return (
                        <tr key={loan.id} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-2">{loan.name}</td>
                          <td className="px-4 py-2">{loan.account_number}</td>
                          <td className="px-4 py-2">{formatCurrency(loan.amount)}</td>
                          <td className="px-4 py-2">{formatCurrency(loan.total_amount)}</td>
                          <td className="px-4 py-2 text-blue-600">
                            {formatCurrency(totalRepaid)}
                          </td>
                          <td
                            className={`px-4 py-2 font-semibold ${
                              balance > 0 ? "text-red-600" : "text-green-600"
                            }`}
                          >
                            {formatCurrency(balance)}
                          </td>
                          <td className="px-4 py-2">
                            {new Date(loan.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2">{loan.status}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
