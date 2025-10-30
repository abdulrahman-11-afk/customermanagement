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

  // Auto-fetch customer
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
        setMessage("Customer not found");
      } else {
        setCustomer(data);
        setMessage("");
      }
    } catch (err) {
      console.error(err);
      setMessage("Error fetching customer");
    } finally {
      setLoading(false);
    }
  };

  // Fetch all loan types (services)
  useEffect(() => {
    const fetchServices = async () => {
      const supabase = getSupabase();
      const { data, error } = await supabase.from("services").select("*");
      if (error) console.error("Error loading services:", error);
      else setServices(data || []);
    };
    fetchServices();
  }, []);

  // Calculate interest and total using reducing balance
  useEffect(() => {
    const amountNum = parseFloat(loanAmount) || 0;
    const rateNum = Number(interestRate) || 0;

    // Assume repayment every month, interest calculated monthly on reducing balance
    const months = duration / 30; // e.g., 90 days = 3 months
    let totalInterest = 0;
    let balance = amountNum;

    for (let i = 0; i < months; i++) {
      const monthlyInterest = (balance * rateNum) / 100 / 12;
      totalInterest += monthlyInterest;
      const monthlyPayment = amountNum / months;
      balance -= monthlyPayment;
    }

    setInterestAmount(totalInterest);
    setTotalAmount(amountNum + totalInterest);
  }, [loanAmount, interestRate, duration]);

  // Handle loan type selection
  const handleLoanTypeChange = (e: any) => {
    const selected = e.target.value;
    setLoanType(selected);
    const service = services.find((s) => s.name === selected);
    if (service) setInterestRate(Number(service.percentage) || 0);
    else setInterestRate(0);
  };

  // Auto-calculate maturity date when duration or effective date changes
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

  // Submit new loan
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return setMessage("Search for a valid customer first!");
    if (!loanType) return setMessage("Select a loan type!");
    if (!loanAmount) return setMessage("Enter loan amount!");
    if (!effectiveDate) return setMessage("Select an effective date!");

    try {
      setLoading(true);
      const loanPayload: any = {
        account_number: accountNumber,
        name: customer.name,
        loan_type: loanType,
        amount: parseFloat(loanAmount),
        interest_rate: interestRate,
        total_amount: totalAmount,
        interest_amount: interestAmount,
        duration,
        repayment_method: repaymentMethod,
        effective_date: effectiveDate,
        maturity_date: maturityDate,
        status: "Active",
      };

      if (otherDetails.trim() !== "") loanPayload.other_details = otherDetails;

      const supabase = getSupabase();
      const { error } = await supabase.from("loans").insert([loanPayload]);
      if (error) throw error;

      setMessage("✅ Loan added successfully!");
      // Reset form
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
      setMessage("❌ Error adding loan");
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
            <h2 className="text-3xl text-green-400 font-bold my-2">
              MIDDLECROWN MULTIVENTURES
            </h2>
          </div>
          <p className="text-xl pt-10 text-green-400">Add New Loan</p>

          <div className="h-[80vh] flex items-center justify-center">
            <form
              onSubmit={handleSubmit}
              className="flex items-center w-[50%] shadow-lg p-8 flex-col gap-5 rounded-xl"
            >
              <p className="text-xl text-green-400">New Loan</p>

              <div className="flex flex-col gap-5 w-full">
                <input
                  type="text"
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

                <select
                  value={loanType}
                  onChange={handleLoanTypeChange}
                  className="border rounded-sm w-full h-10 pl-3"
                >
                  <option value="">Select Loan Type</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>

                <input
                  type="number"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  className="border rounded-sm h-10 pl-3"
                  placeholder="Enter Loan Amount"
                />

                <select  className="border rounded-sm w-full h-10 pl-3" value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
                  <option>Duration</option>
                  <option value={30}>30 days</option>
                  <option value={60}>60 days</option>
                  <option value={90}>90 days</option>
                  <option value={120}>120 days</option>
                </select>

                <select  className="border rounded-sm w-full h-10 pl-3" value={repaymentMethod} onChange={(e) => setRepaymentMethod(e.target.value)}>
                  <option>Repayment Method</option>
                  <option>Weekly</option>
                  <option>Monthly</option>
                  <option>Bullet payment</option>
                </select>

                <input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="border rounded-sm h-10 pl-3"
                  placeholder="Effective Date"
                />

                <input
                  type="text"
                  value={maturityDate ? `Maturity Date: ${maturityDate}` : ""}
                  readOnly
                  placeholder="Maturity Date"
                  className="border rounded-sm h-10 pl-3 bg-gray-100"
                />

                <input
                  type="text"
                  value={`Interest Rate: ${interestRate}%`}
                  readOnly
                  className="border rounded-sm h-10 pl-3 bg-gray-100"
                />
                <input
                  type="text"
                  value={`Interest Amount: ₦${interestAmount.toFixed(2)}`}
                  readOnly
                  className="border rounded-sm h-10 pl-3 bg-gray-100"
                />
                <input
                  type="text"
                  value={`Total Amount: ₦${totalAmount.toFixed(2)}`}
                  readOnly
                  className="border rounded-sm h-10 pl-3 bg-gray-100"
                />

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
