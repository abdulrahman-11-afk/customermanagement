'use client';
import { useState, useEffect } from "react";
import { getSupabase } from "../lib/supabaseClient";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  gender: string;
  marital_status: string;
  next_of_kin: string;
  next_of_kin_number: string;
  address: string;
  occupation: string;
  account_number: string;
  balance: number;
}

export default function ExistingCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<Partial<Customer>>({});
  const [search, setSearch] = useState("");
  const searchParams = useSearchParams();
  const highlightedId = searchParams.get("id");

  useEffect(() => {
    if (!highlightedId || customers.length === 0) return;
    const element = document.getElementById(`customer-${highlightedId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("bg-green-200");
      setTimeout(() => {
        element.classList.remove("bg-green-200");
      }, 3000);
    }
  }, [highlightedId, customers]);

  const fetchCustomers = async () => {
    const supabase = getSupabase();
    if (!supabase) {
      console.error("Supabase client not initialized. Check your .env.local setup.");
      return;
    }
    const { data, error } = await supabase.from("customers").select("*");
    if (error) console.error(error);
    else setCustomers(data || []);
  };

  useEffect(() => {
    fetchCustomers();
    try {
      const savedSearch = localStorage.getItem("customerSearch") || "";
      setSearch(savedSearch);
    } catch {
      setSearch("");
    }
  }, []);

  const handleDelete = async (id: number) => {
    const confirmed = confirm("Are you sure you want to delete this customer?");
    if (!confirmed) return;
    const supabase = getSupabase();
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) console.error(error);
    else setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({ ...customer });
  };

  const [isBankingOpen, setIsBankingOpen] = useState(false);

  const handleSave = async () => {
    if (!editingCustomer) return;
    const supabase = getSupabase();
    const { error } = await supabase
      .from("customers")
      .update(formData)
      .eq("id", editingCustomer.id);
    if (error) console.error(error);
    if (Object.keys(formData).length === 0) return alert("No changes made");
    else {
      setCustomers((prev) =>
        prev.map((c) => (c.id === editingCustomer.id ? { ...c, ...formData } : c))
      );
      setEditingCustomer(null);
    }
  };

  const filteredCustomers = customers.filter((c) =>
    (c.name?.toLowerCase() ?? "").includes(search.toLowerCase()) ||
    (c.account_number?.toLowerCase() ?? "").includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex">
        {/* Fixed Sidebar */}
        <aside className="w-64 bg-gray-100 left-0 fixed flex h-[100vh] flex-col pt-22 p-4 overflow-y-auto z-20">
          <nav className="flex flex-col gap-7">
            <Link href="/dashboard" className="ml-5">Dashboard</Link>
            <Link href="/newcustomer" className="ml-5">New Customer</Link>
            <Link href="/customer" className="bg-green-400 w-40 flex items-center justify-center rounded-md h-10">
              Existing Customers
            </Link>
            <Link href="/servicelist" className="ml-5">Service List</Link>

            {/* Banking Dropdown */}
            <div className="ml-5">
              <button
                onClick={() => setIsBankingOpen(!isBankingOpen)}
                className="w-full text-left cursor-pointer"
              >
                Banking {isBankingOpen ? "▲" : "▼"}
              </button>
              {isBankingOpen && (
                <div className="flex flex-col mt-4 ml-3 gap-5">
                  <Link href="/Banking" className="ml-2 cursor-pointer">Savings</Link>
                  <Link href="/Loan" className="ml-2 cursor-pointer">Loan Facility</Link>
                </div>
              )}
            </div>

            <Link href="/Expenses" className="ml-5">Expenses</Link>
            <Link href="/reports" className="ml-5">Reports</Link>
          </nav>
        </aside>

        {/* Main Section */}
        <main className="flex-1 p-6 ml-64 overflow-y-auto">
          <div className="flex items-center justify-between my-6">
            <h2 className="text-3xl text-green-400 font-bold mb-4">Existing Customers</h2>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                localStorage.setItem("customerSearch", e.target.value);
              }}
              placeholder="Search customer"
              className="border-2 border-green-400 rounded-md px-3 mr-5 py-2 mb-4 w-60 placeholder:text-green-400 focus:outline-none"
            />
          </div>

          <table className="min-w-full border border-gray-300">
            <thead className="bg-green-500 text-white">
              <tr>
                <th className="border px-4 py-2">Name</th>
                <th className="border px-4 py-2">Phone</th>
                <th className="border px-4 py-2">Email</th>
                <th className="border px-4 py-2">Account Balance</th>
                <th className="border px-4 py-2">Gender</th>
                <th className="border px-4 py-2">Marital Status</th>
                <th className="border px-4 py-2">Next of Kin</th>
                <th className="border px-4 py-2">Next of Kin Number</th>
                <th className="border px-4 py-2">Address</th>
                <th className="border px-4 py-2">Occupation</th>
                <th className="border px-4 py-2">Account Number</th>
                <th className="border px-4 py-2">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredCustomers.map((customer) => (
                <tr
                  id={`customer-${customer.id}`}
                  key={customer.id}
                  className="hover:bg-gray-100"
                >
                  <td className="border px-4 py-2">{customer.name}</td>
                  <td className="border px-4 py-2">{customer.phone}</td>
                  <td className="border px-4 py-2">{customer.email}</td>
                  <td className="border px-4 py-2">₦{(customer.balance ?? 0).toFixed(2)}</td>
                  <td className="border px-4 py-2">{customer.gender}</td>
                  <td className="border px-4 py-2">{customer.marital_status}</td>
                  <td className="border px-4 py-2">{customer.next_of_kin}</td>
                  <td className="border px-4 py-2">{customer.next_of_kin_number}</td>
                  <td className="border px-4 py-2">{customer.address}</td>
                  <td className="border px-4 py-2">{customer.occupation}</td>
                  <td className="border px-4 py-2">{customer.account_number}</td>
                  <td className="border px-4 py-2 flex flex-col gap-2">
                    <button
                      className="bg-green-400 px-2 py-1 rounded cursor-pointer"
                      onClick={() => handleEdit(customer)}
                    >
                      Edit
                    </button>
                    <button
                      className="bg-red-500 text-white px-2 py-1 rounded cursor-pointer"
                      onClick={() => handleDelete(customer.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {editingCustomer && (
            <div className="fixed inset-0 bg-gray-50 bg-opacity-30 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-96">
                <h3 className="text-xl font-bold mb-4">Edit Customer</h3>
                {Object.keys(formData).map(
                  (key) =>
                    key !== "id" && (
                      <div key={key} className="mb-2">
                        <input
                          type="text"
                          aria-label={`edit-${key}`}
                          value={formData[key as keyof Customer] || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              [key]: e.target.value,
                            })
                          }
                          className="w-full border px-2 py-1 rounded"
                          placeholder={key}
                        />
                      </div>
                    )
                )}
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    className="bg-green-500 text-white px-4 py-2 rounded cursor-pointer"
                    onClick={handleSave}
                  >
                    Save
                  </button>
                  <button
                    className="bg-red-500 text-white px-4 py-2 rounded cursor-pointer"
                    onClick={() => setEditingCustomer(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
