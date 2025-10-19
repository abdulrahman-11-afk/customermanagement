"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";

type Service = {
  id: number;
  name: string;
  charge: number;
  percentage: number;
};

export default function ServiceList() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newService, setNewService] = useState({ name: "", charge: "", percentage: "" });
  const [editingService, setEditingService] = useState<Service | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data, error } = await supabase.from("services").select("*").order("id", { ascending: true });
        if (error) throw error;
        setServices((data || []) as Service[]);
      } catch (err) {
        console.error("Error loading services:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const handleAddService = async () => {
    if (!newService.name.trim()) return alert("Enter service name");
    setIsSubmitting(true);
    const charge = Number(newService.charge) || 0;
    const percentage = Number(newService.percentage) || 0;

    if (charge < 0) return alert("Charge must be 0 or greater");
    if (percentage < 0 || percentage > 100) return alert("Percentage must be between 0 and 100");

    const newItem = { name: newService.name.trim(), charge, percentage };

    try {
      const { data, error } = await supabase.from("services").insert([newItem]).select();
      if (error) throw error;
      if (data && data.length > 0) {
        setServices((prev) => [...prev, data[0] as Service]);
      }
      setNewService({ name: "", charge: "", percentage: "" });
    } catch (err) {
      console.error("Supabase error:", err);
      alert("Error saving service");
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleSaveEdit = async () => {
    if (!editingService) return;
    setIsSubmitting(true);

    const updated = {
      name: newService.name.trim(),
      charge: Number(newService.charge) || 0,
      percentage: Number(newService.percentage) || 0,
    };

    if (!updated.name) return alert("Service name cannot be empty");
    if (updated.charge < 0) return alert("Charge must be 0 or greater");
    if (updated.percentage < 0 || updated.percentage > 100) return alert("Percentage must be between 0 and 100");

    try {
      const { data, error } = await supabase.from("services").update(updated).eq("id", editingService.id).select();
      if (error) throw error;
      if (data && data.length > 0) {
        const updatedRow = data[0] as Service;
        setServices((prev) => prev.map((s) => (s.id === editingService.id ? updatedRow : s)));
      } else {
        setServices((prev) => prev.map((s) => (s.id === editingService.id ? { ...s, ...updated } : s)));
      }
      setEditingService(null);
      setNewService({ name: "", charge: "", percentage: "" });
    } catch (err) {
      console.error("Update error:", err);
      alert("Error updating service");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (service: any) => {
    setEditingService(service as Service);
    setNewService({ name: service.name, charge: String(service.charge ?? ""), percentage: String(service.percentage ?? "") });
  };

  const handleCancelEdit = () => {
    setEditingService(null);
    setNewService({ name: "", charge: "", percentage: "" });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    try {
      const { data, error } = await supabase.from("services").delete().eq("id", id).select();
      if (error) throw error;
      setServices((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error("Delete error:", err);
      alert("Error deleting service");
    }
  }

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
            <Link href="/Expenses" className="bg-green-400 w-40 flex items-center justify-center rounded-md h-10">Expenses</Link>
            <Link href="/reports" className="ml-5">Reports</Link>
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1 p-6">
          <div className="flex items-center justify-center">
            <h2 className="text-3xl cursor-pointer text-green-400 font-bold my-2">
              MIDDLECROWN MULTIVENTURES
            </h2>
          </div>

          <p className="text-xl pt-10 text-green-400">
            {editingService ? "Edit Expenses" : "Add Expenses"}
          </p>

          <div className="mt-6 flex flex-wrap gap-4">
            <input
              type="text"
              placeholder="Expense Name"
              className="border p-2 rounded w-48"
              value={newService.name}
              aria-label="service-name"
              onChange={(e) => setNewService({ ...newService, name: e.target.value })}
            />
            <input
              type="number"
              placeholder="Charge (₦)"
              className="border p-2 rounded w-32"
              value={newService.charge}
              aria-label="service-charge"
              onChange={(e) => setNewService({ ...newService, charge: e.target.value })}
            />
            <input
              type="number"
              placeholder="Percentage (%)"
              className="border p-2 text-sm rounded w-32"
              value={newService.percentage}
              aria-label="service-percentage"
              onChange={(e) => setNewService({ ...newService, percentage: e.target.value })}
            />

            {editingService ? (
              <>
                <button onClick={handleSaveEdit} disabled={isSubmitting} className="bg-green-500 disabled:opacity-60 text-white px-4 py-2 rounded hover:bg-green-600">Save</button>
                <button onClick={handleCancelEdit} disabled={isSubmitting} className="bg-gray-400 disabled:opacity-60 text-white px-4 py-2 rounded hover:bg-gray-500">Cancel</button>
              </>
            ) : (
              <button onClick={handleAddService} disabled={isSubmitting} className="bg-green-500 disabled:opacity-60 text-white px-4 py-2 rounded hover:bg-green-600">Add Expense</button>
            )}
          </div>

          <table className="min-w-full mt-10 border border-gray-300">
            <thead className="bg-green-500 text-white">
              <tr>
                <th className="border px-4 py-2">Service Name</th>
                <th className="border px-4 py-2">Charge (₦)</th>
                <th className="border px-4 py-2">Percentage (%)</th>
                <th className="w-60">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center py-4 text-gray-500">Loading...</td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-4 text-gray-500">
                    No services added yet
                  </td>
                </tr>
              ) : (
                services.map((service) => (
                  <tr key={service.id} className="text-center border">
                    <td className="border px-4 py-2">{service.name}</td>
                    <td className="border px-4 py-2">{service.charge}</td>
                    <td className="border px-4 py-2">{service.percentage}%</td>
                    <td className="px-4 py-2 flex justify-center gap-2">
                      <button onClick={() => handleEdit(service)} className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">Edit</button>
                      <button onClick={() => handleDelete(service.id)} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">Delete</button>
                    </td>
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
