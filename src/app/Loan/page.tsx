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

  // Debounced fetch when typing account number
  useEffect(() => {
    if (!accountNumber) {
      setCustomer(null);
      setLoans([]);
      setRepayments([]);
      setAmountOwing(0);
      setMessage("");
      return;
    }

    if (typingTimeout) clearTimeout(typingTimeout);
    const timeout = setTimeout(() => fetchCustomerAndLoans(accountNumber), 700);
    setTypingTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [accountNumber]);

  // Fetch customer, loans and repayments for that customer's active loans
  const fetchCustomerAndLoans = async (accNum: string) => {
    try {
      setLoading(true);
      setMessage("");
      const supabase = getSupabase();

      // Use maybeSingle to avoid throwing if no row found
      const { data: custData, error: custError } = await supabase
        .from("customers")
        .select("*")
        .eq("account_number", accNum.toString())
        .maybeSingle();

      if (custError || !custData) {
        setCustomer(null);
        setLoans([]);
        setRepayments([]);
        setAmountOwing(0);
        setMessage("❌ Customer not found");
        return;
      }

      setCustomer(custData);

      // Ensure account_number used as string (DB expects text/varchar)
      const { data: loansData, error: loanError } = await supabase
        .from("loans")
        .select("*")
        .eq("account_number", accNum.toString())
        .eq("status", "Active");

      if (loanError) throw loanError;
      setLoans(loansData || []);

      const loanIds = (loansData || []).map((l: any) => Number(l.id)).filter(Boolean);

      if (loanIds.length === 0) {
        setRepayments([]);
        setAmountOwing(0);
        return;
      }

      // Make sure loanIds is an array of numbers
      const { data: repayData, error: repayError } = await supabase
        .from("repayments")
        .select("*")
        .in("loan_id", loanIds)
        .order("due_date", { ascending: true });

      if (repayError) throw repayError;

      const repayArr = repayData || [];
      setRepayments(repayArr);

      // calculate total owing from unpaid schedules
      const totalOwing = repayArr
        .filter((r: any) => r.status !== "Paid")
        .reduce((sum: number, r: any) => sum + (Number(r.total_payment) || 0) - (Number(r.amount_paid) || 0), 0);

      setAmountOwing(totalOwing || 0);
      setMessage("");
    } catch (err: any) {
      console.error("fetchCustomerAndLoans error:", err);
      setMessage("⚠️ Error fetching customer / loan data. Check console.");
    } finally {
      setLoading(false);
    }
  };

  // Comma-format input while typing (keeps only digits)
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/,/g, "").replace(/[^\d.]/g, "");
    // Allow empty input
    if (raw === "") {
      setAmount("");
      return;
    }
    // Prevent multiple dots
    const dotCount = (raw.match(/\./g) || []).length;
    if (dotCount > 1) return;

    // format integer/decimal part
    const parts = raw.split(".");
    const intPart = parts[0] ? Number(parts[0]).toLocaleString() : "0";
    const decimalPart = parts[1] ? "." + parts[1].slice(0, 2) : ""; // limit to 2 decimals visually
    setAmount(intPart + decimalPart);
  };

  // Submit repayment and update schedules; mark loans paid when schedules fully paid
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    if (!customer) return setMessage("❌ Search for a valid customer first!");
    if (!amount) return setMessage("❌ Enter repayment amount!");
    if (loans.length === 0) return setMessage("❌ No active loans found!");

    const supabase = getSupabase();

    // Convert formatted amount -> number
    let repaymentAmount = Number(amount.replace(/,/g, ""));
    if (isNaN(repaymentAmount) || repaymentAmount <= 0) {
      return setMessage("❌ Enter a valid repayment amount");
    }

    try {
      setLoading(true);

      // Work on unpaid schedules sorted by due_date (already sorted in state)
      const unpaidSchedules = repayments.filter((r) => r.status !== "Paid");

      if (unpaidSchedules.length === 0) {
        setMessage("✅ No unpaid schedules found.");
        return;
      }

      // Build updates locally first
      const updatedSchedules: { id: number | string; amount_paid: number; status: string }[] = [];
      let remainingToAllocate = repaymentAmount;

      for (const schedule of unpaidSchedules) {
        if (remainingToAllocate <= 0) break;
        const totalPayment = Number(schedule.total_payment) || 0;
        const alreadyPaid = Number(schedule.amount_paid) || 0;
        const remaining = totalPayment - alreadyPaid;
        if (remaining <= 0) continue;

        const payNow = Math.min(remainingToAllocate, remaining);
        const newPaid = alreadyPaid + payNow;
        const newStatus = newPaid >= totalPayment ? "Paid" : "Partial";

        updatedSchedules.push({
          id: schedule.id,
          amount_paid: newPaid,
          status: newStatus,
        });

        remainingToAllocate -= payNow;
      }

      // Persist updates (sequentially). Could be batched but this is explicit & robust
      for (const us of updatedSchedules) {
        const { error } = await supabase
          .from("repayments")
          .update({
            amount_paid: us.amount_paid,
            status: us.status,
            // optionally update other_details or created_at if needed
          })
          .eq("id", us.id);
        if (error) {
          console.error("Error updating schedule id", us.id, error);
          throw error;
        }
      }

      // After updating schedules, check each active loan — if all schedules are Paid then mark loan Paid
      const { data: activeLoans } = await supabase
        .from("loans")
        .select("id")
        .eq("account_number", accountNumber.toString())
        .eq("status", "Active");

      for (const loan of activeLoans || []) {
        const { data: schedulesForLoan, error: schErr } = await supabase
          .from("repayments")
          .select("status")
          .eq("loan_id", loan.id);

        if (schErr) {
          console.error("Error reading schedules for loan", loan.id, schErr);
          throw schErr;
        }

        const allPaid = (schedulesForLoan || []).every((s: any) => s.status === "Paid");
        if (allPaid) {
          const { error } = await supabase.from("loans").update({ status: "Paid" }).eq("id", loan.id);
          if (error) {
            console.error("Error updating loan status for ", loan.id, error);
            throw error;
          }
        }
      }

      setMessage("✅ Repayment recorded and schedules updated!");
      setAmount("");
      // refresh local state
      await fetchCustomerAndLoans(accountNumber);
    } catch (err: any) {
      console.error("handleSubmit error:", err);
      setMessage("❌ Error recording repayment. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  // Format currency readout
  const formatCurrency = (n: number | string) => {
    const num = typeof n === "string" ? Number(n.replace(/,/g, "")) : n;
    if (isNaN(num)) return "₦0.00";
    return `₦${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

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
              <label>
                Account Number:
                <input
                  type="text"
                  placeholder="Enter Account Number"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="border rounded-md p-2 w-full mt-1"
                />
              </label>

              <label>
                Customer Name:
                <input
                  type="text"
                  readOnly
                  value={customer ? customer.name : ""}
                  className="border rounded-md p-2 bg-gray-100 w-full mt-1"
                  placeholder="Customer Name"
                />
              </label>

              <div className="flex items-center justify-between gap-4">
                <label className="flex-1">
                  Amount to Pay:
                  <input
                    type="text"
                    placeholder="Enter Amount (e.g. 10,000)"
                    value={amount}
                    onChange={handleAmountChange}
                    className="border rounded-md p-2 w-full mt-1"
                  />
                </label>

                <div className="w-48">
                  <div className="text-xs text-gray-500">Total owing</div>
                  <div className="font-semibold">{formatCurrency(amountOwing)}</div>
                </div>
              </div>

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
                  <div className="grid grid-cols-5 gap-2 border-b p-2 text-center font-medium bg-gray-50">
                    <div>#</div><div>Due</div><div>Total</div><div>Paid</div><div>Status</div>
                  </div>
                  {repayments.map((r, i) => (
                    <div key={i} className="grid grid-cols-5 gap-2 border-b p-2 text-center">
                      <div>#{r.installment_number}</div>
                      <div>{r.due_date}</div>
                      <div>{formatCurrency(r.total_payment)}</div>
                      <div>{formatCurrency(r.amount_paid || 0)}</div>
                      <div className={`${r.status === "Paid" ? "text-green-600" : "text-gray-500"}`}>{r.status}</div>
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
