"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";

export default function NewRepayment() {
  const [accountNumber, setAccountNumber] = useState("");
  const [customer, setCustomer] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [otherDetails, setOtherDetails] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [repayments, setRepayments] = useState<any[]>([]);
  const [loadingRepayments, setLoadingRepayments] = useState(false);

  // Auto-fetch customer and loan details by account number
  useEffect(() => {
    if (!accountNumber) {
      setCustomer(null);
      setMessage("");
      return;
    }

    if (typingTimeout) clearTimeout(typingTimeout);

    const timeout = setTimeout(() => {
      fetchCustomerAndLoans(accountNumber);
    }, 1000);

    setTypingTimeout(timeout);
  }, [accountNumber]);

  const [loans, setLoans] = useState<any[]>([]);
  const [amountOwing, setAmountOwing] = useState(0);

  const fetchCustomerAndLoans = async (accNum: string) => {
    try {
      setLoading(true);
      setMessage("");

      // Get customer
      const { data: custData, error: custError } = await supabase
        .from("customers")
        .select("*")
        .eq("account_number", accNum)
        .single();

      if (custError || !custData) {
        setCustomer(null);
        setLoans([]);
        setAmountOwing(0);
        setMessage("❌ Customer not found");
        return;
      }

      setCustomer(custData);

      // Get active loans for this account
      const { data: loansData, error: loansError } = await supabase
        .from("loans")
        .select("*")
        .eq("account_number", accNum)
        .eq("status", "Active");  // only consider active loans

      if (loansError) throw loansError;

      // Get repayments for this account
      const { data: repsData, error: repsError } = await supabase
        .from("repayments")
        .select("*")
        .eq("account_number", accNum)
        .order("created_at", { ascending: false });

      if (repsError) throw repsError;

      // Calculate totals
      const totalPayable = (loansData || []).reduce((sum, loan) => sum + Number(loan.total_amount || loan.amount || 0), 0);
      const totalRepaid = (repsData || []).reduce((sum, rep) => sum + Number(rep.amount || 0), 0);
      const owing = Math.max(0, totalPayable - totalRepaid);

      setLoans(loansData || []);
      setRepayments(repsData || []);
      setAmountOwing(owing);
      setMessage("");

    } catch (err) {
      console.error("Error fetching customer data:", err);
      setMessage("❌ Error fetching customer data");
      setCustomer(null);
      setLoans([]);
      setAmountOwing(0);
    } finally {
      setLoading(false);
      setLoadingRepayments(false);
    }
  };

  // Allocate repayments to active loans (FIFO by created_at) and mark fully paid loans as 'Paid'
  const allocateRepaymentsAndMarkPaid = async (accNum: string) => {
    try {
      // fetch active loans (oldest first)
      const { data: loansData, error: loansError } = await supabase
        .from("loans")
        .select("id, total_amount, amount, created_at")
        .eq("account_number", accNum)
        .eq("status", "Active")
        .order("created_at", { ascending: true });

      if (loansError) {
        console.error("Error fetching loans for allocation:", loansError);
        return;
      }

      // fetch total repaid for this account
      const { data: repsData, error: repsError } = await supabase
        .from("repayments")
        .select("amount")
        .eq("account_number", accNum);

      if (repsError) {
        console.error("Error fetching repayments for allocation:", repsError);
        return;
      }

      const totalRepaid = (repsData || []).reduce((s: number, r: any) => s + Number(r.amount || 0), 0);

      // allocate FIFO
      let remaining = totalRepaid;
      const paidIds: number[] = [];

      for (const loan of loansData || []) {
        const loanTotal = Number(loan.total_amount ?? loan.amount ?? 0);
        if (remaining >= loanTotal && loanTotal > 0) {
          paidIds.push(loan.id);
          remaining -= loanTotal;
        } else {
          // not enough remaining to mark this loan paid; stop allocation
          break;
        }
      }

      if (paidIds.length > 0) {
        const { error: updErr } = await supabase
          .from("loans")
          .update({ status: "Paid" })
          .in("id", paidIds);

        if (updErr) console.error("Error updating loan status to Paid:", updErr);
      }
    } catch (err) {
      console.error("allocateRepaymentsAndMarkPaid error:", err);
    }
  };

  const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`;
  const formatDate = (d?: string | null) => d ? new Date(d).toLocaleDateString() : "—";

  // Submit repayment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return setMessage("Search for a valid customer first!");
    if (!amount) return setMessage("Enter repayment amount!");
    // prevent repayments when nothing is owing
    if (amountOwing <= 0 || loans.length === 0) {
      setMessage("❌ No outstanding loans to repay for this account.");
      return;
    }

    try {
      setLoading(true);
      const repaymentPayload: any = {
        account_number: accountNumber,
        name: customer.name,
        amount: parseFloat(amount) || 0,
      };

      if (otherDetails && otherDetails.trim() !== "") repaymentPayload.other_details = otherDetails;

      const { error } = await supabase.from("repayments").insert([repaymentPayload]);

      if (error) throw error;

      setMessage("✅ Repayment added successfully!");
  // allocate repayments to loans and mark fully paid loans
  await allocateRepaymentsAndMarkPaid(accountNumber);
  // re-fetch customer, loans, and repayments to update totals
  await fetchCustomerAndLoans(accountNumber);
      setAmount("");
      setOtherDetails("");

      // auto-hide success message
      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (err) {
      console.error(err);
      setMessage("❌ Error adding repayment");
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

        {/* Main content */}
        <main className="flex-1 p-6">
          <div className="flex items-center justify-center">
            <h2 className="text-3xl cursor-pointer text-green-400 font-bold my-2">
              MIDDLECROWN MULTIVENTURES
            </h2>
          </div>

          <div>
            <p className="text-xl pt-10 text-green-400">Add New Repayment</p>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex justify-center">
              <form
                onSubmit={handleSubmit}
                className="w-[50%] shadow-lg p-8 flex flex-col gap-5 rounded-xl"
              >
                <p className="text-xl text-green-400">New Repayment</p>

                <div className="flex flex-col gap-5 w-full">
                  <input
                    type="text"
                    aria-label="paymentloan-account-number"
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

                  {customer && (
                    <div className="flex flex-col gap-2 bg-gray-50 p-3 rounded border">
                      <h3 className="font-semibold text-sm">Loan Summary</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Active Loans:</div>
                        <div>{loans.length}</div>
                        <div>Total Amount Owing:</div>
                        <div className="font-semibold text-green-600">{formatCurrency(amountOwing)}</div>
                      </div>
                    </div>
                  )}

                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="border rounded-sm w-full h-10 pl-3"
                    placeholder="Enter Repayment Amount"
                    disabled={loading || amountOwing <= 0 || loans.length === 0}
                  />
                  {amountOwing <= 0 && loans.length === 0 && (
                    <p className="text-sm text-gray-500">This account has no active loans to repay.</p>
                  )}
                  {amountOwing <= 0 && loans.length > 0 && (
                    <p className="text-sm text-gray-500">All loans for this account are fully paid.</p>
                  )}

                  <input
                    type="text"
                    value={otherDetails}
                    onChange={(e) => setOtherDetails(e.target.value)}
                    className="border rounded-sm w-full h-10 pl-3"
                    placeholder="Other Details"
                  />
                </div>

                <button
                  type="submit"
                  aria-label="paymentloan-submit"
                  disabled={loading || amountOwing <= 0 || loans.length === 0}
                  className="border w-30 h-10 rounded-lg text-white bg-green-500 hover:scale-105 transition hover:bg-white hover:text-green-500 duration-300"
                >
                  {loading ? "Processing..." : "Submit"}
                </button>

                {message && (
                  <p className={`text-sm mt-2 text-center ${message.includes("❌") ? "text-red-600" : "text-green-600"}`}>
                    {message}
                  </p>
                )}
              </form>
            </div>

            {/* {customer && (
              <div className="mx-auto w-[80%]">
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b">
                    <h3 className="text-sm font-semibold">Active Loans</h3>
                  </div>
                  <div className="divide-y">
                    {loans.map(loan => (
                      <div key={loan.id} className="p-4">
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-gray-500">Loan Type</div>
                            <div>{loan.loan_type}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Amount</div>
                            <div>{formatCurrency(loan.amount)}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Total Payable</div>
                            <div>{formatCurrency(loan.total_amount)}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Date</div>
                            <div>{formatDate(loan.created_at)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 bg-white shadow rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b">
                    <h3 className="text-sm font-semibold">Repayment History</h3>
                  </div>
                  <div className="divide-y">
                    {loadingRepayments ? (
                      <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
                    ) : repayments.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">No repayment history found</div>
                    ) : (
                      repayments.map((rep, idx) => (
                        <div key={rep.id || idx} className="p-4">
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="text-gray-500">Date</div>
                              <div>{formatDate(rep.created_at)}</div>
                            </div>
                            <div>
                              <div className="text-gray-500">Amount</div>
                              <div>{formatCurrency(rep.amount)}</div>
                            </div>
                            <div className="col-span-2">
                              <div className="text-gray-500">Details</div>
                              <div>{rep.other_details || '—'}</div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )} */}
          </div>
        </main>
      </div>
    </div>
  );
}
