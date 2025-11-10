"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase } from "../lib/supabaseClient";

const Page = () => {
  const [phone, setPhone] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showPopup, setShowPopup] = useState(false);
  const router = useRouter();

  useEffect(() => {
    generateAccountNumber();
    document.querySelector<HTMLInputElement>('input[name="name"]')?.focus();
  }, []);

  const generateAccountNumber = async () => {
    try {
      const supabase = getSupabase();
      if (!supabase) {
        setAccountNumber("202501");
        return;
      }

      const { data, error } = await supabase
        .from("customers")
        .select("account_number")
        .order("account_number", { ascending: false })
        .limit(1);

      if (error) {
        console.error("Error fetching last account number:", error);
        setAccountNumber("202501");
        return;
      }

      if (data && data.length > 0 && data[0].account_number) {
        const lastAccNum = parseInt(data[0].account_number);
        const nextAccNum = isNaN(lastAccNum) ? 202501 : lastAccNum + 1;
        setAccountNumber(nextAccNum.toString());
      } else {
        setAccountNumber("202501");
      }
    } catch (err) {
      console.error("Unexpected error generating account number:", err);
      setAccountNumber("202501");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    const formData = new FormData(e.target as HTMLFormElement);
    const customer = {
      name: formData.get("name") as string,
      phone,
      email: formData.get("email") as string,
      gender: formData.get("gender") as string,
      marital_status: formData.get("marital_status") as string,
      next_of_kin: formData.get("next_of_kin") as string,
      next_of_kin_number: formData.get("next_of_kin_number") as string, // ✅ FIXED FIELD NAME
      address: formData.get("address") as string,
      occupation: formData.get("occupation") as string,
      account_number: accountNumber,
      balance: 0.0,
    };

    const validationErrors: { [key: string]: string } = {};
    for (const key in customer) {
      if (key !== "balance" && !customer[key as keyof typeof customer]) {
        validationErrors[key] = "This field is required";
      }
    }

    if (phone && phone.length !== 11) {
      validationErrors.phone = "Phone number must be 11 digits";
    }

    if (customer.next_of_kin_number && customer.next_of_kin_number.length !== 11) {
      validationErrors.next_of_kin_number = "Next of kin number must be 11 digits";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      alert("Supabase not available");
      return;
    }
    const { data: existing, error: fetchError } = await supabase
      .from("customers")
      .select("email, phone")
      .or(`email.eq.${customer.email},phone.eq.${customer.phone}`);

    if (fetchError) {
      console.error("Error checking duplicates:", fetchError);
    } else if (existing && existing.length > 0) {
      const duplicateErrors: { [key: string]: string } = {};
      if (existing.some((c) => c.email === customer.email)) {
        duplicateErrors.email = "Email already exists";
      }
      if (existing.some((c) => c.phone === customer.phone)) {
        duplicateErrors.phone = "Phone number already exists";
      }
      setErrors(duplicateErrors);
      return;
    }
    const { data, error } = await supabase
      .from("customers")
      .insert([customer])
      .select();

    if (error) {
      console.error("Insert error:", error);
      alert("Error saving customer: " + error.message);
      setErrors({ submit: "Failed to save customer. Please try again." });
    } else {
      setShowPopup(true);
    }
  };

  const handleReset = () => {
    setPhone("");
    setErrors({});
    generateAccountNumber();
  };

  return (
    <div className="flex flex-col min-h-screen relative">
      <div className={showPopup ? "blur-md pointer-events-none" : ""}>
        <div className="flex">
          <aside className="w-64 bg-gray-100 flex flex-col h-[100vh] pt-22 p-4">
            <nav className="flex flex-col gap-7">
              <Link href="/dashboard" className="ml-5">Dashboard</Link>
              <Link href="/newcustomer" className="bg-green-400 w-40 flex items-center justify-center rounded-md h-10">New Customer</Link>
              <Link href="/customer" className="ml-5">Existing Customers</Link>
              <Link href="/servicelist" className="ml-5">Service List</Link>
              <Link href="/Banking" className="ml-5">Banking</Link>
              <Link href="/Loan" className="ml-5">Loan</Link>
              <Link href="/Expenses" className="ml-5">Expenses</Link>
              <Link href="/reports" className="ml-5">Reports</Link>
            </nav>
          </aside>

          <main className="flex-1 p-6">
            <div className="flex flex-col items-center justify-center gap-6 w-full">
              <h2 className="text-2xl md:text-3xl text-green-500 font-bold text-center">
                MIDDLECROWN MULTIVENTURES
              </h2>

              <form
                onSubmit={handleSubmit}
                className="bg-white shadow-md rounded-lg p-6 md:p-10 w-full max-w-3xl space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <input name="name" type="text" placeholder="Customer Name" className="w-full border rounded-md px-3 py-2" />
                    {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                  </div>

                  <div>
                    <input
                      name="phone"
                      type="text"
                      inputMode="numeric"
                      placeholder="Phone Number"
                      value={phone}
                      onChange={(e) => /^\d*$/.test(e.target.value) && setPhone(e.target.value)}
                      className="w-full border rounded-md px-3 py-2"
                    />
                    {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
                  </div>

                  <div>
                    <input name="email" type="email" placeholder="Email" className="w-full border rounded-md px-3 py-2" />
                    {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                  </div>

                  <div>
                    <select name="gender" className="w-full border rounded-md px-3 py-2">
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                    {errors.gender && <p className="text-red-500 text-sm">{errors.gender}</p>}
                  </div>

                  <div>
                    <select name="marital_status" className="w-full border rounded-md px-3 py-2">
                      <option value="">Marital Status</option>
                      <option value="single">Single</option>
                      <option value="married">Married</option>
                    </select>
                    {errors.marital_status && <p className="text-red-500 text-sm">{errors.marital_status}</p>}
                  </div>

                  <div>
                    <input name="next_of_kin" type="text" placeholder="Next of Kin" className="w-full border rounded-md px-3 py-2" />
                    {errors.next_of_kin && <p className="text-red-500 text-sm">{errors.next_of_kin}</p>}
                  </div>
                  <div>
                    <input
                      name="next_of_kin_number"
                      type="text"
                      inputMode="numeric"
                      placeholder="Next of Kin Number"
                      className="w-full border rounded-md px-3 py-2"
                    />
                    {errors.next_of_kin_number && <p className="text-red-500 text-sm">{errors.next_of_kin_number}</p>}
                  </div>

                  <div>
                    <input name="address" type="text" placeholder="Address" className="w-full border rounded-md px-3 py-2" />
                    {errors.address && <p className="text-red-500 text-sm">{errors.address}</p>}
                  </div>

                  <div>
                    <input name="occupation" type="text" placeholder="Occupation" className="w-full border rounded-md px-3 py-2" />
                    {errors.occupation && <p className="text-red-500 text-sm">{errors.occupation}</p>}
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    value={accountNumber}
                    readOnly
                    placeholder="Account Number"
                    className="w-full border rounded-md px-3 py-2 bg-gray-100 text-gray-600 cursor-pointer"
                  />
                </div>

                {errors.submit && <p className="text-red-500 text-center">{errors.submit}</p>}

                <div className="flex flex-col md:flex-row gap-3 justify-end">
                  <button type="submit" className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-md">
                    Submit
                  </button>
                  <button type="button" onClick={handleReset} className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-md">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </main>
        </div>
      </div>

      {showPopup && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80 md:w-96 text-center">
            <h2 className="text-xl font-bold text-green-500 mb-4">Account Created Successfully!</h2>
            <p className="mb-6">The new customer has been saved.</p>
            <button
              onClick={() => router.push("/customer")}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-md"
            >
              Go to Existing Customer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;
