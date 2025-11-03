import { createClient } from "../../lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import type { Database } from "../../lib/database.types";

type Post = Database["public"]["Tables"]["posts"]["Row"];
type Author = Database["public"]["Tables"]["authors"]["Row"];

interface PostWithAuthor extends Post {
  authors: Pick<Author, "name" | "bio" | "picture_url"> | null;
}

export const revalidate = 600;

async function getPost(slug: string): Promise<PostWithAuthor> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*, authors ( name, bio, picture_url )")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !data) {
    notFound();
  }

  return data;
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  return (
    <article className="mx-auto max-w-4xl p-4 py-8 md:p-8">
      <h1 className="mb-4 text-3xl font-extrabold leading-tight text-gray-900 md:text-5xl">
        {post.title}
      </h1>

      {post.authors && (
        <div className="mb-8 flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            <span>Por {post.authors.name}</span>
            <span className="mx-2">•</span>
            <time dateTime={post.created_at}>
              {new Date(post.created_at).toLocaleDateString("pt-BR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          </div>
        </div>
      )}

      {post.image_url && (
        <div className="relative mb-8 w-full overflow-hidden rounded-lg aspect-video">
          <Image
            src={post.image_url}
            alt={post.title}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      )}

      <div className="prose prose-lg max-w-none">
        {post.content && <ReactMarkdown>{post.content}</ReactMarkdown>}
      </div>

      {post.authors && post.authors.bio && (
        <div className="mt-12 rounded-lg border bg-gray-50 p-6">
          <div className="flex items-center gap-4">
            {post.authors.picture_url && (
              <Image
                src={post.authors.picture_url}
                alt={post.authors.name || "Autor"}
                width={80}
                height={80}
                className="h-20 w-20 shrink-0 rounded-full object-cover"
              />
            )}
            <div className="grow">
              <h4 className="text-xl font-semibold">{post.authors.name}</h4>
              <p className="mt-1 text-gray-600">{post.authors.bio}</p>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
