import { createClient } from "../lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import type { Database } from "../lib/database.types";

type Post = Database["public"]["Tables"]["posts"]["Row"];
type Author = Database["public"]["Tables"]["authors"]["Row"];

interface PostWithAuthor extends Post {
  authors: Pick<Author, "name"> | null;
}

export const revalidate = 600;

const POST_CARD_SELECT =
  "title, slug, image_url, created_at, category, authors ( name )";

async function getHeroPost(category: string) {
  const supabase = createClient();
  const { data: post } = await supabase
    .from("posts")
    .select(POST_CARD_SELECT)
    .eq("status", "published")
    .eq("category", category)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  return post;
}

export default async function HomePage() {
  const supabase = createClient();

  const [heroPostsData, latestPostsData, recapPostsData] = await Promise.all([
    Promise.all([
      getHeroPost("Cinema"),
      getHeroPost("Séries"),
      getHeroPost("Animes"),
      getHeroPost("Games"),
    ]),
    supabase
      .from("posts")
      .select(POST_CARD_SELECT)
      .eq("status", "published")
      .neq("category", "Resumo Semanal")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("posts")
      .select(POST_CARD_SELECT)
      .eq("status", "published")
      .eq("category", "Resumo Semanal")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const heroPosts = heroPostsData.filter(Boolean) as PostWithAuthor[];
  const latestPosts = latestPostsData.data as PostWithAuthor[];
  const recapPosts = recapPostsData.data as PostWithAuthor[];

  const mainRecapPost =
    recapPosts && recapPosts.length > 0 ? recapPosts[0] : null;
  const otherRecapPosts = recapPosts ? recapPosts.slice(1) : [];

  const [post1, post2, post3, post4] = heroPosts;

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-8">
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        {post1 && (
          <Link
            href={`/${post1.slug}`}
            key={post1.id}
            className="group relative h-[400px] overflow-hidden rounded-lg shadow-lg"
          >
            {post1.image_url && (
              <Image
                src={post1.image_url}
                alt={post1.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                unoptimized
                loading="eager"
              />
            )}
            <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/40 to-transparent" />
            <div className="absolute bottom-0 p-4 text-white">
              <span className="text-sm font-semibold uppercase text-blue-300">
                {post1.category}
              </span>
              <h2 className="mt-1 text-2xl font-bold group-hover:underline">
                {post1.title}
              </h2>
            </div>
          </Link>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:grid-rows-2">
          {post2 && (
            <Link
              href={`/${post2.slug}`}
              key={post2.id}
              className="group relative h-[190px] overflow-hidden rounded-lg shadow-lg md:col-span-2"
            >
              {post2.image_url && (
                <Image
                  src={post2.image_url}
                  alt={post2.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  unoptimized
                />
              )}
              <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 p-3 text-white">
                <span className="text-xs font-semibold uppercase text-blue-300">
                  {post2.category}
                </span>
                <h2 className="mt-1 text-lg font-bold group-hover:underline">
                  {post2.title}
                </h2>
              </div>
            </Link>
          )}

          {post3 && (
            <Link
              href={`/${post3.slug}`}
              key={post3.id}
              className="group relative h-[190px] overflow-hidden rounded-lg shadow-lg"
            >
              {post3.image_url && (
                <Image
                  src={post3.image_url}
                  alt={post3.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  unoptimized
                />
              )}
              <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 p-3 text-white">
                <span className="text-xs font-semibold uppercase text-blue-300">
                  {post3.category}
                </span>
                <h2 className="mt-1 text-md font-bold group-hover:underline">
                  {post3.title}
                </h2>
              </div>
            </Link>
          )}

          {post4 && (
            <Link
              href={`/${post4.slug}`}
              key={post4.id}
              className="group relative h-[190px] overflow-hidden rounded-lg shadow-lg"
            >
              {post4.image_url && (
                <Image
                  src={post4.image_url}
                  alt={post4.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  unoptimized
                />
              )}
              <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 p-3 text-white">
                <span className="text-xs font-semibold uppercase text-blue-300">
                  {post4.category}
                </span>
                <h2 className="mt-1 text-md font-bold group-hover:underline">
                  {post4.title}
                </h2>
              </div>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-4 border-b-2 border-blue-700 pb-2 text-xl font-bold uppercase">
            Últimos Posts
          </h2>
          <div className="space-y-6">
            {latestPosts.map((post) => (
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

            <Link
              href="/posts"
              className="block text-center font-semibold text-blue-600 hover:underline"
            >
              Carregar mais artigos &gt;
            </Link>
          </div>
        </div>

        <aside className="lg:col-span-1">
          <div className="sticky top-8">
            <h2 className="mb-4 border-b-2 border-red-700 pb-2 text-xl font-bold uppercase">
              Lançamentos da Semana
            </h2>
            <div className="space-y-4">
              {mainRecapPost && (
                <Link
                  href={`/${mainRecapPost.slug}`}
                  key={mainRecapPost.id}
                  className="group"
                >
                  {mainRecapPost.image_url && (
                    <Image
                      src={mainRecapPost.image_url}
                      alt={mainRecapPost.title}
                      width={400}
                      height={200}
                      className="h-56 w-full rounded-md object-cover"
                      unoptimized
                    />
                  )}
                  <h3 className="mt-2 text-xl font-bold text-gray-900 group-hover:text-blue-700">
                    {mainRecapPost.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Por {mainRecapPost.authors?.name || "NexoPixel"}
                  </p>
                </Link>
              )}
              {otherRecapPosts.map((post) => (
                <Link
                  href={`/${post.slug}`}
                  key={post.id}
                  className="group flex items-center gap-4"
                >
                  {post.image_url && (
                    <Image
                      src={post.image_url}
                      alt={post.title}
                      width={100}
                      height={60}
                      className="h-16 w-24 shrink-0 rounded-md object-cover"
                      unoptimized
                    />
                  )}
                  <div>
                    <h4 className="font-semibold text-gray-900 group-hover:text-blue-700">
                      {post.title}
                    </h4>
                  </div>
                </Link>
              ))}
              <Link
                href="/releases"
                className="block text-center font-semibold text-blue-600 hover:underline"
              >
                Ver todos os lançamentos &gt;
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
