"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import Link from "next/link";

interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  gender: string;
  marital_status: string;
  next_of_kin: string;
  address: string;
  occupation: string;
  account_number: string;
}

export default function ExistingCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<Partial<Customer>>({});

  // Fetch customers
  const fetchCustomers = async () => {
    const { data, error } = await supabase.from("customers").select("*");
    if (error) console.error(error);
    else setCustomers(data);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Delete customer
  const handleDelete = async (id: number) => {
    const confirmed = confirm("Are you sure you want to delete this customer?");
    if (!confirmed) return;

    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) console.error(error);
    else {
      // Remove deleted customer from state immediately
      setCustomers(customers.filter((c) => c.id !== id));
    }
  };

  // Start editing
  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({ ...customer }); // Copy customer data to formData
  };

  // Save edits
  const handleSave = async () => {
    if (!editingCustomer) return;

    const { error } = await supabase
      .from("customers")
      .update(formData)
      .eq("id", editingCustomer.id);

    if (error) console.error(error);
    else {
      // Update customer in state immediately
      setCustomers(
        customers.map((c) =>
          c.id === editingCustomer.id ? { ...c, ...formData } : c
        )
      );
      setEditingCustomer(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex">
        <aside className="w-64 bg-gray-100 flex h-[100vh] flex-col pt-22 p-4">
          <nav className="flex flex-col gap-7">
            <Link href="/dashboard" className="ml-5">Dashboard</Link>
            <Link href="/newcustomer" className="ml-5">New Customer</Link>
            <Link href="/customer" className="bg-green-400 w-40 flex items-center justify-center rounded-md h-10">Existing Customers</Link>
            <Link href="/servicelist" className="ml-5">Service List</Link>
            <Link href="/Banking" className="ml-5">Banking</Link>
            <Link href="/Loan" className="ml-5">Loan</Link>
            <Link href="/Expenses" className="ml-5">Expenses</Link>
            <Link href="/reports" className="ml-5">Reports</Link>
          </nav>
        </aside>

        <main className="flex-1 p-6">
          <h2 className="text-3xl text-green-400 font-bold mb-6">Existing Customers</h2>

          <table className="min-w-full border border-gray-300">
            <thead className="bg-green-200">
              <tr>
                <th className="border px-4 py-2">Name</th>
                <th className="border px-4 py-2">Phone</th>
                <th className="border px-4 py-2">Email</th>
                <th className="border px-4 py-2">Gender</th>
                <th className="border px-4 py-2">Marital Status</th>
                <th className="border px-4 py-2">Next of Kin</th>
                <th className="border px-4 py-2">Address</th>
                <th className="border px-4 py-2">Occupation</th>
                <th className="border px-4 py-2">Account Number</th>
                <th className="border px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-100">
                  <td className="border px-4 py-2">{customer.name}</td>
                  <td className="border px-4 py-2">{customer.phone}</td>
                  <td className="border px-4 py-2">{customer.email}</td>
                  <td className="border px-4 py-2">{customer.gender}</td>
                  <td className="border px-4 py-2">{customer.marital_status}</td>
                  <td className="border px-4 py-2">{customer.next_of_kin}</td>
                  <td className="border px-4 py-2">{customer.address}</td>
                  <td className="border px-4 py-2">{customer.occupation}</td>
                  <td className="border px-4 py-2">{customer.account_number}</td>
                  <td className="border px-4 py-2 flex gap-2">
                    <button
                      className="bg-yellow-400 px-2 py-1 rounded"
                      onClick={() => handleEdit(customer)}
                    >
                      Edit
                    </button>
                    <button
                      className="bg-red-500 text-white px-2 py-1 rounded"
                      onClick={() => handleDelete(customer.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Edit Modal */}
          {editingCustomer && (
            <div className="fixed inset-0 bg-gray-50 bg-opacity-30 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-96">
                <h3 className="text-xl font-bold mb-4">Edit Customer</h3>

                {Object.keys(formData).map((key) => (
                  key !== "id" && (
                    <div key={key} className="mb-2">
                      <input
                        type="text"
                        value={formData[key as keyof Customer] || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, [key]: e.target.value })
                        }
                        className="w-full border px-2 py-1 rounded"
                        placeholder={key}
                      />
                    </div>
                  )
                ))}

                <div className="flex justify-end gap-2 mt-4">
                  <button
                    className="bg-green-500 text-white px-4 py-2 rounded"
                    onClick={handleSave}
                  >
                    Save
                  </button>
                  <button
                    className="bg-red-500 text-white px-4 py-2 rounded"
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
