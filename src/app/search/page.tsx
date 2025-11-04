import { createClient } from "../../lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import type { Database } from "../../lib/database.types";

type Post = Database["public"]["Tables"]["posts"]["Row"];
type Author = Database["public"]["Tables"]["authors"]["Row"];

interface PostWithAuthor extends Post {
  authors: Pick<Author, "name"> | null;
}

const POST_CARD_SELECT =
  "title, slug, image_url, created_at, category, authors ( name )";

async function getSearchResults(query: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("posts")
    .select(POST_CARD_SELECT)
    .eq("status", "published")
    .or(`title.ilike.*${query}*,slug.ilike.*${query}*`)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Erro ao buscar posts:", error);
    return [];
  }

  return data as PostWithAuthor[];
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) {
  const { query } = await searchParams;
  const posts = query ? await getSearchResults(query) : [];

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-8">
      <div className="mx-auto max-w-3xl">
        {!query ? (
          <h2 className="mb-6 pb-2 text-2xl font-bold uppercase">
            Por favor, digite um termo para buscar
          </h2>
        ) : (
          <h2 className="mb-6 border-b-2 border-blue-700 pb-2 text-2xl font-bold uppercase">
            Resultados para: &quot;{query}&quot;
          </h2>
        )}

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
          query && (
            <p className="text-center text-gray-500">
              Nenhum artigo encontrado para esta busca.
            </p>
          )
        )}
      </div>
    </div>
  );
}
