import { createClient } from "../../lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Database } from "../../lib/database.types";

type Post = Database["public"]["Tables"]["posts"]["Row"];
type Author = Database["public"]["Tables"]["authors"]["Row"];

interface PostWithAuthor extends Post {
  authors: Pick<Author, "name"> | null;
}

const POSTS_POR_PAGINA = 10;
const OFFSET_DA_HOMEPAGE = 10;

const POST_CARD_SELECT =
  "title, slug, image_url, created_at, category, authors ( name )";

async function getPostsData(pagina: number) {
  const supabase = createClient();

  const from = (pagina - 1) * POSTS_POR_PAGINA + OFFSET_DA_HOMEPAGE;
  const to = from + POSTS_POR_PAGINA - 1;

  const { data: posts, error } = await supabase
    .from("posts")
    .select(POST_CARD_SELECT)
    .eq("status", "published")
    .neq("category", "Resumo Semanal")
    .order("created_at", { ascending: false })
    .range(from, to);

  const { count, error: countError } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("status", "published")
    .neq("category", "Resumo Semanal");

  if (error || countError) {
    console.error("Erro ao buscar posts:", error || countError);
    notFound();
  }

  const totalPaginas = Math.ceil(
    (count || 0 - OFFSET_DA_HOMEPAGE) / POSTS_POR_PAGINA
  );

  return { posts: posts as PostWithAuthor[], totalPaginas };
}

export default async function PostsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const paginaAtual = Number(searchParams.page) || 1;
  const { posts, totalPaginas } = await getPostsData(paginaAtual);

  const temPaginaAnterior = paginaAtual > 1;
  const temPaginaProxima = paginaAtual < totalPaginas;

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-8">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-6 border-b-2 border-blue-700 pb-2 text-2xl font-bold uppercase">
          Artigos Anteriores
        </h2>

        {posts && posts.length > 0 ? (
          <div className="space-y-6">
            {posts.map((post) => (
              <Link
                href={`/${post.slug}`}
                key={post.id}
                className="group flex flex-row items-start gap-4"
              >
                {post.image_url && (
                  <Image
                    src={post.image_url}
                    alt={post.title}
                    width={150}
                    height={150}
                    className="h-32 w-32 shrink-0 rounded-md object-cover"
                    unoptimized
                  />
                )}
                <div className="grow">
                  <span className="text-sm font-semibold uppercase text-blue-600">
                    {post.category}
                  </span>
                  <h3 className="mt-1 text-xl font-bold text-gray-900 group-hover:text-blue-700">
                    {post.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Por {post.authors?.name || "NexoPixel"} ·{" "}
                    {new Date(post.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">
            Nenhum artigo anterior encontrado.
          </p>
        )}

        <div className="mt-12 flex justify-between">
          {temPaginaAnterior ? (
            <Link
              href={`/posts?page=${paginaAtual - 1}`}
              className="rounded-md bg-gray-800 px-4 py-2 text-white hover:bg-gray-700"
            >
              &larr; Página Anterior
            </Link>
          ) : (
            <div />
          )}
          {temPaginaProxima ? (
            <Link
              href={`/posts?page=${paginaAtual + 1}`}
              className="rounded-md bg-gray-800 px-4 py-2 text-white hover:bg-gray-700"
            >
              Próxima Página &rarr;
            </Link>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );
}
