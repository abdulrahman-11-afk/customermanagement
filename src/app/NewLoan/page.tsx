"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { getSupabase } from "../lib/supabaseClient";

export default function NewLoan() {
  const [accountNumber, setAccountNumber] = useState("");
  const [customer, setCustomer] = useState<any>(null);
  const [loanType, setLoanType] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [interestRate, setInterestRate] = useState(0);
  const [interestAmount, setInterestAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [otherDetails, setOtherDetails] = useState("");
  const [services, setServices] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  const [duration, setDuration] = useState(30);
  const [repaymentMethod, setRepaymentMethod] = useState("Monthly");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [maturityDate, setMaturityDate] = useState("");

  useEffect(() => {
    if (!accountNumber) {
      setCustomer(null);
      setMessage("");
      return;
    }

    if (typingTimeout) clearTimeout(typingTimeout);
    const timeout = setTimeout(() => fetchCustomer(accountNumber), 1000);
    setTypingTimeout(timeout);
  }, [accountNumber]);

  const fetchCustomer = async (accNum: string) => {
    try {
      setLoading(true);
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("account_number", accNum)
        .single();

      if (error || !data) {
        setCustomer(null);
        setMessage("❌ Customer not found");
      } else {
        setCustomer(data);
        setMessage("");
      }
    } catch (err) {
      console.error(err);
      setMessage("⚠️ Error fetching customer");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchServices = async () => {
      const supabase = getSupabase();
      const { data, error } = await supabase.from("services").select("*");
      if (error) console.error("Error loading services:", error);
      else setServices(data || []);
    };
    fetchServices();
  }, []);

  useEffect(() => {
    const amount = Number(loanAmount.replace(/,/g, "")) || 0;
    const rate = Number(interestRate) || 0;
    const months = duration / 30;
    const totalInterest = (amount * rate * months) / (100 * 12);
    setInterestAmount(totalInterest);
    setTotalAmount(amount + totalInterest);
  }, [loanAmount, interestRate, duration]);

  const handleLoanTypeChange = (e: any) => {
    const selected = e.target.value;
    setLoanType(selected);
    const service = services.find((s) => s.name === selected);
    setInterestRate(service ? Number(service.percentage) || 0 : 0);
  };

  const handleAmountChange = (e: any) => {
    const raw = e.target.value.replace(/,/g, "");
    if (!/^\d*$/.test(raw)) return;
    const formatted = Number(raw).toLocaleString("en-US");
    setLoanAmount(formatted);
  };

  useEffect(() => {
    if (effectiveDate) {
      const start = new Date(effectiveDate);
      const end = new Date(start);
      end.setDate(start.getDate() + duration);
      setMaturityDate(end.toISOString().split("T")[0]);
    } else {
      setMaturityDate("");
    }
  }, [effectiveDate, duration]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customer) return setMessage("❌ Invalid customer account number");
    if (!loanType) return setMessage("❌ Please select a loan type");
    if (!loanAmount) return setMessage("❌ Enter loan amount");
    if (!effectiveDate) return setMessage("❌ Choose an effective date");

    try {
      setLoading(true);
      const amountNum = Number(loanAmount.replace(/,/g, "")) || 0;

      const loanPayload = {
        account_number: accountNumber,
        name: customer.name,
        loan_type: loanType,
        amount: amountNum,
        interest_rate: Number(interestRate),
        total_amount: Number(totalAmount),
        duration,
        repayment_method: repaymentMethod,
        effective_date: effectiveDate,
        maturity_date: maturityDate,
        status: "Active",
        other_details: otherDetails.trim() || null,
      };

      const supabase = getSupabase();
      const { error } = await supabase.from("loans").insert([loanPayload]);
      if (error) {
        console.error(error);
        return setMessage(`❌ Error adding loan: ${error.message}`);
      }

      setMessage("✅ Loan added successfully!");
      setAccountNumber("");
      setCustomer(null);
      setLoanType("");
      setLoanAmount("");
      setInterestRate(0);
      setInterestAmount(0);
      setTotalAmount(0);
      setOtherDetails("");
      setEffectiveDate("");
      setMaturityDate("");
    } catch (err) {
      console.error(err);
      setMessage("⚠️ Unexpected error adding loan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex">
        <aside className="w-64 bg-gray-100 flex flex-col pt-22 p-4">
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
          <div className="flex items-center justify-center">
            <h2 className="text-3xl text-green-400 font-bold my-2">
              MIDDLECROWN MULTIVENTURES
            </h2>
          </div>

          <p className="text-xl pt-10 text-green-400">Add New Loan</p>

          <div className="flex items-center justify-center">
            <form
              onSubmit={handleSubmit}
              className="flex flex-col w-[50%] shadow-lg p-8 gap-5 rounded-xl"
            >
              <p className="text-xl text-green-400">New Loan</p>

              <label className="text-sm font-medium text-gray-700">Account Number</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="border rounded-sm w-full h-10 pl-3"
                placeholder="Enter customer account number"
              />

              <label className="text-sm font-medium text-gray-700">Customer Name</label>
              <input
                type="text"
                value={customer ? customer.name : ""}
                readOnly
                className="border rounded-sm w-full h-10 pl-3 bg-gray-100"
                placeholder="Auto-filled from customer"
              />

              <label className="text-sm font-medium text-gray-700">Loan Type</label>
              <select
                value={loanType}
                onChange={handleLoanTypeChange}
                className="border rounded-sm w-full h-10 pl-3"
              >
                <option value="">Select loan type</option>
                {services.map((s) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>

              <label className="text-sm font-medium text-gray-700">Loan Amount</label>
              <input
                type="text"
                value={loanAmount}
                onChange={handleAmountChange}
                className="border rounded-sm h-10 pl-3"
                placeholder="Enter loan amount (e.g. 500,000)"
              />

              <label className="text-sm font-medium text-gray-700">Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="border rounded-sm w-full h-10 pl-3"
              >
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
                <option value={90}>90 days</option>
                <option value={120}>120 days</option>
              </select>

              <label className="text-sm font-medium text-gray-700">Repayment Method</label>
              <select
                value={repaymentMethod}
                onChange={(e) => setRepaymentMethod(e.target.value)}
                className="border rounded-sm w-full h-10 pl-3"
              >
                <option>Weekly</option>
                <option>Monthly</option>
                <option>Bullet payment</option>
              </select>

              <label className="text-sm font-medium text-gray-700">Effective Date</label>
              <input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="border rounded-sm h-10 pl-3"
              />

              <label className="text-sm font-medium text-gray-700">Maturity Date</label>
              <input
                type="text"
                value={maturityDate ? maturityDate : ""}
                readOnly
                className="border rounded-sm h-10 pl-3 bg-gray-100"
              />

              <label className="text-sm font-medium text-gray-700">Interest Rate</label>
              <input
                type="text"
                value={`${interestRate}%`}
                readOnly
                className="border rounded-sm h-10 pl-3 bg-gray-100"
              />

              <label className="text-sm font-medium text-gray-700">Interest Amount</label>
              <input
                type="text"
                value={`₦${interestAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                readOnly
                className="border rounded-sm h-10 pl-3 bg-gray-100"
              />

              <label className="text-sm font-medium text-gray-700">Total Amount</label>
              <input
                type="text"
                value={`₦${totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                readOnly
                className="border rounded-sm h-10 pl-3 bg-gray-100"
              />

              <label className="text-sm font-medium text-gray-700">Other Details</label>
              <input
                type="text"
                value={otherDetails}
                onChange={(e) => setOtherDetails(e.target.value)}
                className="border rounded-sm w-full h-10 pl-3"
                placeholder="Optional"
              />

              <button
                type="submit"
                disabled={loading}
                className="border w-30 h-10 rounded-lg text-white bg-green-500 hover:scale-105 transition hover:bg-white hover:text-green-500 duration-300"
              >
                {loading ? "Processing..." : "Submit"}
              </button>

              {message && <p className="text-sm mt-2 text-green-600 text-center">{message}</p>}
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
