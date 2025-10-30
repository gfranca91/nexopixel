import { redirect } from "next/navigation";
// 1. Importamos o client de SERVIDOR (que já estava)
import { createClient } from "../../../lib/supabase/server";
// 2. Importamos nosso novo botão de Logout
import LogoutButton from "./LogoutButton";
// 3. Importamos o tipo 'Post' do nosso banco de dados
// (Presumindo que o Supabase gerou a tabela 'posts' corretamente)
import type { Database } from "../../../lib/database.types";
type Post = Database["public"]["Tables"]["posts"]["Row"];

export default async function DashboardPage() {
  const supabase = createClient();

  // 4. A mesma verificação de segurança (essencial)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect("/admin/login");
  }

  // 5. BUSCAR OS DADOS (A nova parte!)
  // Buscamos todos os posts que são 'draft', ordenados pelo mais recente
  const { data: drafts, error: draftsError } = await supabase
    .from("posts")
    .select("*") // Seleciona todas as colunas
    .eq("status", "draft") // Onde o status é 'draft'
    .order("created_at", { ascending: false }); // Os mais novos primeiro

  if (draftsError) {
    console.error("Erro ao buscar rascunhos:", draftsError.message);
  }

  return (
    <div className="mx-auto max-w-4xl p-8">
      {/* --- Cabeçalho --- */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="mt-1 text-lg text-gray-600">
            Bem-vindo, <span className="font-semibold">{user.email}</span>!
          </p>
        </div>
        {/* 6. Adicionamos o botão de Logout */}
        <LogoutButton />
      </div>

      {/* --- Lista de Rascunhos --- */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold">Rascunhos Pendentes</h2>

        {/* 7. Lógica de exibição */}
        {!drafts || drafts.length === 0 ? (
          <p className="mt-4 text-gray-500">Nenhum rascunho encontrado.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {/* 8. Mapeamos os rascunhos */}
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
                      {new Date(post.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </span>
                </div>
                {/* TODO: Linkar para a página de edição (ex: /admin/editor/POST_ID) */}
                <button className="mt-4 rounded-md bg-gray-800 px-3 py-1 text-sm text-white hover:bg-gray-700">
                  Editar (em breve)
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
