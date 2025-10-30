import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import LogoutButton from "./LogoutButton";
import Link from "next/link";
import type { Database } from "../../../lib/database.types";

type Post = Database["public"]["Tables"]["posts"]["Row"];

export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect("/admin/login");
  }

  const { data: drafts, error: draftsError } = await supabase
    .from("posts")
    .select("*")
    .eq("status", "draft")
    .order("created_at", { ascending: false });

  if (draftsError) {
    console.error("Erro ao buscar rascunhos:", draftsError.message);
  }

  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="mt-1 text-lg text-gray-600">
            Bem-vindo, <span className="font-semibold">{user.email}</span>!
          </p>
        </div>
        <LogoutButton />
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold">Rascunhos Pendentes</h2>

        {!drafts || drafts.length === 0 ? (
          <p className="mt-4 text-gray-500">Nenhum rascunho encontrado.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {drafts.map((post: Post) => (
              <li
                key={post.id}
                className="rounded-lg border bg-white p-4 shadow-sm"
              >
                <h3 className="text-xl font-bold text-blue-700">
                  {post.title}
                </h3>
                <div className="mt-2 flex space-x-4 text-sm text-gray-500">
                  <span>
                    Categoria:{" "}
                    <span className="font-medium text-gray-800">
                      {post.category}
                    </span>
                  </span>
                  <span>
                    Criado em:{" "}
                    <span className="font-medium text-gray-800">
                      {post.created_at
                        ? new Date(post.created_at).toLocaleDateString("pt-BR")
                        : "N/A"}
                    </span>
                  </span>
                </div>

                <Link
                  href={`/admin/editor/${post.slug}`}
                  className="mt-4 inline-block rounded-md bg-gray-800 px-3 py-1 text-sm text-white hover:bg-gray-700"
                >
                  Editar
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
