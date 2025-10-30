import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";

export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  if (user.email !== process.env.ADMIN_EMAIL) {
    console.warn(`Tentativa de acesso não autorizada: ${user.email}`);
    redirect("/");
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <p className="mt-2 text-lg">
        Bem-vindo, <span className="font-semibold">{user.email}</span>!
      </p>
      <p>Você está autorizado.</p>
    </div>
  );
}
