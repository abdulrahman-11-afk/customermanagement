"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { getSupabase } from "../lib/supabaseClient";

export default function NewRepayment() {
  const [accountNumber, setAccountNumber] = useState("");
  const [customer, setCustomer] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  const [loans, setLoans] = useState<any[]>([]);
  const [repayments, setRepayments] = useState<any[]>([]);
  const [amountOwing, setAmountOwing] = useState(0);

  useEffect(() => {
    if (!accountNumber) {
      setCustomer(null);
      setMessage("");
      return;
    }

    if (typingTimeout) clearTimeout(typingTimeout);
    const timeout = setTimeout(() => fetchCustomerAndLoans(accountNumber), 1000);
    setTypingTimeout(timeout);
  }, [accountNumber]);

  // Fetch customer, loans, and repayment schedule
  const fetchCustomerAndLoans = async (accNum: string) => {
    try {
      setLoading(true);
      const supabase = getSupabase();

      // Fetch customer
      const { data: custData, error: custError } = await supabase
        .from("customers")
        .select("*")
        .eq("account_number", accNum)
        .single();

      if (custError || !custData) {
        setCustomer(null);
        setLoans([]);
        setRepayments([]);
        setAmountOwing(0);
        setMessage("❌ Customer not found");
        return;
      }

      setCustomer(custData);

      // Fetch active loans
      const { data: loansData, error: loanError } = await supabase
        .from("loans")
        .select("*")
        .eq("account_number", accNum)
        .eq("status", "Active");

      if (loanError) throw loanError;
      setLoans(loansData || []);

      // Fetch repayment schedule for these loans
      const loanIds = (loansData || []).map((l: any) => l.id);
      if (loanIds.length === 0) {
        setRepayments([]);
        setAmountOwing(0);
        return;
      }

      const { data: repayData, error: repayError } = await supabase
        .from("repayments")
        .select("*")
        .in("loan_id", loanIds)
        .order("due_date", { ascending: true });

      if (repayError) throw repayError;

      setRepayments(repayData || []);

      const totalOwing = repayData
        ?.filter((r) => r.status !== "Paid")
        .reduce((sum, r) => sum + (Number(r.total_payment) || 0), 0);

      setAmountOwing(totalOwing || 0);
      setMessage("");
    } catch (err) {
      console.error(err);
      setMessage("❌ Error fetching customer/loan data");
    } finally {
      setLoading(false);
    }
  };

  // Handle repayment logic (apply to next unpaid schedule)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return setMessage("Search for a valid customer first!");
    if (!amount) return setMessage("Enter repayment amount!");
    if (loans.length === 0) return setMessage("No active loans found!");

    try {
      setLoading(true);
      const supabase = getSupabase();
      let repaymentAmount = parseFloat(amount);
      const updatedSchedules = [];

      // Get all unpaid schedules, sorted by due_date
      const unpaidSchedules = repayments.filter((r) => r.status !== "Paid");

      for (let schedule of unpaidSchedules) {
        if (repaymentAmount <= 0) break;

        const remaining = schedule.total_payment - (schedule.amount_paid || 0);
        const payNow = Math.min(repaymentAmount, remaining);
        const newPaid = (schedule.amount_paid || 0) + payNow;
        const newStatus = newPaid >= schedule.total_payment ? "Paid" : "Partial";

        updatedSchedules.push({
          id: schedule.id,
          amount_paid: newPaid,
          status: newStatus,
        });

        repaymentAmount -= payNow;
      }

      // Update all affected repayment schedules
      for (const s of updatedSchedules) {
        await supabase
          .from("repayments")
          .update({
            amount_paid: s.amount_paid,
            status: s.status,
          })
          .eq("id", s.id);
      }

      // Check for fully paid loans
      const { data: checkLoans } = await supabase
        .from("loans")
        .select("id")
        .eq("account_number", accountNumber)
        .eq("status", "Active");

      for (const loan of checkLoans || []) {
        const { data: schedules } = await supabase
          .from("repayments")
          .select("status")
          .eq("loan_id", loan.id);

        if (schedules && schedules.every((s) => s.status === "Paid")) {
          await supabase.from("loans").update({ status: "Paid" }).eq("id", loan.id);
        }
      }

      setMessage("✅ Repayment recorded and schedules updated!");
      setAmount("");
      await fetchCustomerAndLoans(accountNumber);
    } catch (err) {
      console.error(err);
      setMessage("❌ Error recording repayment");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (n: number) => `₦${n.toLocaleString()}`;

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
            <Link href="/Loan" className="ml-5">Loan</Link>
            <Link href="/Expenses" className="ml-5">Expenses</Link>
            <Link href="/reports" className="ml-5">Reports</Link>
          </nav>
        </aside>

        <main className="flex-1 p-6">
          <h2 className="text-3xl text-green-400 font-bold text-center mb-8">MIDDLECROWN MULTIVENTURES</h2>

          <div className="max-w-2xl mx-auto shadow-lg p-8 rounded-xl bg-white">
            <h3 className="text-xl text-green-500 mb-4">Loan Repayment</h3>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Enter Account Number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="border rounded-md p-2"
              />
              <input
                type="text"
                readOnly
                value={customer ? customer.name : ""}
                className="border rounded-md p-2 bg-gray-100"
                placeholder="Customer Name"
              />
              <input
                type="number"
                placeholder="Enter Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="border rounded-md p-2"
              />

              <button
                disabled={loading}
                type="submit"
                className="bg-green-500 text-white rounded-md py-2 hover:bg-green-600 transition"
              >
                {loading ? "Processing..." : "Submit Repayment"}
              </button>
            </form>

            {message && (
              <p className={`text-center mt-4 ${message.includes("❌") ? "text-red-600" : "text-green-600"}`}>
                {message}
              </p>
            )}

            {repayments.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold mb-2">Repayment Schedule</h4>
                <div className="text-sm border rounded-md">
                  {repayments.map((r, i) => (
                    <div key={i} className="grid grid-cols-5 gap-2 border-b p-2 text-center">
                      <div>#{r.installment_number}</div>
                      <div>{r.due_date}</div>
                      <div>{formatCurrency(r.total_payment)}</div>
                      <div>{formatCurrency(r.amount_paid || 0)}</div>
                      <div className={`${r.status === "Paid" ? "text-green-600" : "text-gray-500"}`}>
                        {r.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
