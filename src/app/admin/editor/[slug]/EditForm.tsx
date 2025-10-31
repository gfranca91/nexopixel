"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../../lib/supabase/client";
import type { Database } from "../../../../lib/database.types";

type Post = Database["public"]["Tables"]["posts"]["Row"];

interface EditFormProps {
  post: Post;
}

export default function EditForm({ post }: EditFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content || "");
  const [imageUrl, setImageUrl] = useState(post.image_url || "");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const handleApprove = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("Publicando...");

    const { error } = await supabase
      .from("posts")
      .update({
        title: title,
        content: content,
        image_url: imageUrl,
        status: "published",
      })
      .eq("id", post.id);

    if (error) {
      setMessage(`Erro ao publicar: ${error.message}`);
      setIsSubmitting(false);
    } else {
      setMessage("Post publicado com sucesso! Redirecionando...");
      router.push("/admin/dashboard");
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleApprove} className="mt-8 space-y-6">
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700"
        >
          Título
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 p-3 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label
          htmlFor="imageUrl"
          className="block text-sm font-medium text-gray-700"
        >
          URL da Imagem (Link)
        </label>
        <input
          type="url"
          id="imageUrl"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://exemplo.com/imagem.jpg"
          className="mt-1 block w-full rounded-md border-gray-300 p-3 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Preview da imagem"
            className="mt-4 w-full rounded-md object-cover"
          />
        )}
      </div>

      <div>
        <label
          htmlFor="content"
          className="block text-sm font-medium text-gray-700"
        >
          Conteúdo
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={15}
          className="mt-1 block w-full rounded-md border-gray-300 p-3 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div className="flex items-center justify-between">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isSubmitting ? "Publicando..." : "Aprovar e Publicar"}
        </button>
        {message && <p className="text-sm text-gray-600">{message}</p>}
      </div>
    </form>
  );
}
