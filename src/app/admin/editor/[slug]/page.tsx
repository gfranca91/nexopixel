import { redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import type { Database } from "../../../../lib/database.types";
import EditForm from "./EditForm";

type Post = Database["public"]["Tables"]["posts"]["Row"];

interface EditorPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function EditorPage({ params }: EditorPageProps) {
  const { slug: postSlug } = await params;

  const supabaseAuth = createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect("/admin/login");
  }

  const { data: post, error } = await supabaseAdmin
    .from("posts")
    .select("*")
    .eq("slug", postSlug)
    .single();

  if (error || !post) {
    console.error(`Erro ao buscar post (slug: ${postSlug}):`, error?.message);
    redirect("/admin/dashboard");
  }

  return (
    <div className="mx-auto max-w-4xl p-8">
      <h1 className="text-3xl font-bold">Editor de Post</h1>
      <p className="mt-1 text-lg text-gray-600">
        Editando o post: <span className="font-semibold">{post.title}</span>
      </p>

      <EditForm post={post} />
    </div>
  );
}
