"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";


export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data, error } = await supabase
      .from("admin")
      .select("*")
      .eq("username", username)
      .eq("password", password)
      .single();
    if (error || !data) {
      setError("Invalid username or password");

      setTimeout(() => {
        setError("");
      }, 5000);

      return;
    }


    localStorage.setItem("isAuth", "true");
    router.push("/dashboard");
  };


  return (
  
    <div className="h-screen flex items-center flex-col justify-center dark:bg-gray-900 bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-6 rounded-xl shadow-lg w-70 md:w-96 space-y-4"
      >
        <h2 className="text-2xl font-bold text-center text-green-500">Admin Login</h2>

        <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)}
          className="w-full dark:border-black dark:border-2 dark:placeholder:text-black border dark:text-black rounded-md px-3 py-2"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full dark:border-black dark:border-2 dark:placeholder:text-black border dark:text-black rounded-md px-3 py-2"
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button className="w-full bg-green-500 text-white cursor-pointer py-2 rounded-md">
          Login
        </button>
      </form>
    </div>
  );
}
