"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "../lib/supabaseClient";

interface Expense {
  id: number;
  expense_date: string;
  category: string;
  details: string;
  quantity: number;
  unit_price: number;
  total_cost: number;
}

export default function ExpenseSummary() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState<Expense[]>([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [yearlyTotal, setYearlyTotal] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = getSupabase();
      if (!supabase) {
        console.error("Supabase client not found");
        return;
      }

      const { data, error } = await supabase.from("expenses").select("*");

      if (error) {
        console.error("Error loading expenses:", error);
        return;
      }

      if (data) calculateTotals(data);
    };

    fetchData();
  }, []);

  const calculateTotals = (data: Expense[]) => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const monthly = data.filter(
      (exp) =>
        new Date(exp.expense_date).getMonth() === thisMonth &&
        new Date(exp.expense_date).getFullYear() === thisYear
    );

    const monthlyTotal = monthly.reduce(
      (sum, exp) => sum + Number(exp.total_cost),
      0
    );

    const yearly = data.filter(
      (exp) => new Date(exp.expense_date).getFullYear() === thisYear
    );

    const yearlyTotal = yearly.reduce(
      (sum, exp) => sum + Number(exp.total_cost),
      0
    );

    setExpenses(data);
    setMonthlyExpenses(monthly);
    setMonthlyTotal(monthlyTotal);
    setYearlyTotal(yearlyTotal);
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
            <Link href="/Loan" className="ml-5">
              Loan
            </Link>
            <Link
              href="/Expenses"
              className="ml-5"
            >
              Expenses
            </Link>
            <Link
              href="/ExpenseSummary"
              className="bg-green-400 w-40 flex items-center justify-center rounded-md h-10"
            >
              Expense Summary
            </Link>
            <Link href="/reports" className="ml-5">
              Reports
            </Link>
          </nav>
        </aside>

        {/* Main Section */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="flex items-center justify-center">
            <h2 className="text-3xl text-green-500 font-bold mb-6">
              Expense Summary Report
            </h2>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            <div className="bg-white p-4 rounded-lg border">
              <h2 className="text-sm text-gray-500">
                Total Expenses (This Month)
              </h2>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(monthlyTotal)}
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <h2 className="text-sm text-gray-500">
                Total Expenses (This Year)
              </h2>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(yearlyTotal)}
              </p>
            </div>
          </div>

          {/* Expense History (This Month) */}
          <div className="bg-white p-4 rounded-lg border">
            <h2 className="text-lg font-semibold mb-4 text-gray-700">
              Expense History — {monthName}
            </h2>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Category</th>
                    <th className="px-4 py-2 text-left">Details</th>
                    <th className="px-4 py-2 text-left">Qty</th>
                    <th className="px-4 py-2 text-left">Unit Price</th>
                    <th className="px-4 py-2 text-left">Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyExpenses.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-4 text-gray-500"
                      >
                        No expenses recorded in {monthName}.
                      </td>
                    </tr>
                  ) : (
                    monthlyExpenses.map((exp) => (
                      <tr
                        key={exp.id}
                        className="border-t hover:bg-gray-50 text-gray-700"
                      >
                        <td className="px-4 py-2">
                          {new Date(exp.expense_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2">{exp.category}</td>
                        <td className="px-4 py-2">{exp.details}</td>
                        <td className="px-4 py-2">{exp.quantity}</td>
                        <td className="px-4 py-2">
                          {formatCurrency(exp.unit_price)}
                        </td>
                        <td className="px-4 py-2 text-green-600 font-semibold">
                          {formatCurrency(exp.total_cost)}
                        </td>
                      </tr>
                    ))
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
