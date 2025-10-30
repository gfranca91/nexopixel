"use client";

import { useRouter } from "next/navigation";
import { createClient } from "../../../lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();

  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();

    router.push("/admin/login");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
    >
      Sair (Logout)
    </button>
  );
}
