
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { getSupabase } from "../lib/supabaseClient";

type Expense = {
  id: number;
  expense_date: string;
  category: string;
  details: string;
  quantity: number;
  unit_price: number;
  total_cost: number;
  created_at?: string;
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    category: "",
    details: "",
    quantity: 1,
    unit_price: 0,
    total_cost: 0,
  });

  useEffect(() => {
    const fetchExpenses = async () => {
      setLoading(true);
      try {
        const supabase = getSupabase();
        if (!supabase) throw new Error("Supabase client not available");
        const { data, error } = await supabase
          .from("expenses")
          .select("*")
          .order("expense_date", { ascending: false });
        if (error) throw error;
        setExpenses(data || []);
      } catch (err) {
        console.error("Error loading expenses:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchExpenses();
  }, []);

  // Auto-calculate total cost
  useEffect(() => {
    setForm((f) => ({ ...f, total_cost: Number(f.quantity) * Number(f.unit_price) }));
  }, [form.quantity, form.unit_price]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name === "quantity" || name === "unit_price" ? Number(value) : value }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const supabase = getSupabase();
      if (!supabase) throw new Error("Supabase client not available");
      const payload = {
        ...form,
        expense_date: new Date().toISOString().slice(0, 10),
      };
      const { data, error } = await supabase.from("expenses").insert([payload]).select();
      if (error) throw error;
      setExpenses((prev) => [data[0], ...prev]);
      setForm({ category: "", details: "", quantity: 1, unit_price: 0, total_cost: 0 });
    } catch (err) {
      alert("Error saving expense");
      console.error("Expense error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex">
        {/* Sidebar for navigation only */}
        <aside className="w-64 bg-gray-100 flex h-[100vh] flex-col pt-22 p-4">
          <nav className="flex flex-col gap-7">
            <Link href="/dashboard" className="ml-5">Dashboard</Link>
            <Link href="/newcustomer" className="ml-5">New Customer</Link>
            <Link href="/customer" className="ml-5">Existing Customers</Link>
            <Link href="/servicelist" className="ml-5">Service List</Link>
            <Link href="/Banking" className="ml-5">Banking</Link>
            <Link href="/Loan" className="ml-5">Loan</Link>
            <Link href="/Expenses" className="bg-green-400 w-40 flex items-center justify-center rounded-md h-10">Expenses</Link>
            <Link href="/reports" className="ml-5">Reports</Link>
          </nav>
        </aside>
        {/* Main content: form and table */}
        <main className="flex-1 p-6">
          <div className="flex items-center justify-center">
            <h2 className="text-3xl cursor-pointer text-green-400 font-bold my-2">
              MIDDLECROWN MULTIVENTURES
            </h2>
          </div>
          <p className="text-xl pt-10 text-green-400">Add Expense</p>
          <form onSubmit={handleSubmit} className="mt-6 flex flex-wrap gap-4 items-end">
            <input
              type="text"
              name="category"
              placeholder="Expense Category"
              value={form.category}
              onChange={handleChange}
              className="border p-2 rounded w-40"
              required
            />
            <input
              type="text"
              name="details"
              placeholder="Expense Details"
              value={form.details}
              onChange={handleChange}
              className="border p-2 rounded w-60"
            />
            <input
              type="number"
              name="quantity"
              min={1}
              value={form.quantity === 0 ? "" : form.quantity}
              onChange={handleChange}
              className="border p-2 rounded w-24"
              required
              placeholder="Quantity"
            />
            <input
              type="number"
              name="unit_price"
              min={0}
              step={0.01}
              value={form.unit_price === 0 ? "" : form.unit_price}
              onChange={handleChange}
              className="border p-2 rounded w-32"
              required
              placeholder="Unit Price (₦)"
            />
            <input
              type="number"
              name="total_cost"
              value={form.total_cost === 0 ? "" : form.total_cost}
              readOnly
              className="border p-2 rounded w-32 bg-gray-100 text-gray-600"
              placeholder="Total Cost (₦)"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              {isSubmitting ? "Saving..." : "Add Expense"}
            </button>
          </form>
          <table className="min-w-full mt-10 border border-gray-300">
            <thead className="bg-green-500 text-white">
              <tr>
                <th className="border px-4 py-2">Date</th>
                <th className="border px-4 py-2">Category</th>
                <th className="border px-4 py-2">Details</th>
                <th className="border px-4 py-2">Qty</th>
                <th className="border px-4 py-2">Unit Price (₦)</th>
                <th className="border px-4 py-2">Total Cost (₦)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-gray-500">Loading...</td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-gray-500">No expenses recorded yet</td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="text-center border">
                    <td className="border px-4 py-2">{exp.expense_date}</td>
                    <td className="border px-4 py-2">{exp.category}</td>
                    <td className="border px-4 py-2">{exp.details}</td>
                    <td className="border px-4 py-2">{exp.quantity}</td>
                    <td className="border px-4 py-2">₦{Number(exp.unit_price).toLocaleString()}</td>
                    <td className="border px-4 py-2">₦{Number(exp.total_cost).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </main>
      </div>
    </div>
  );
}
