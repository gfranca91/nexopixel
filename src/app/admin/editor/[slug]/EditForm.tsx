"use client";

import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../../lib/supabase/client";
import type { Database } from "../../../../lib/database.types";
import { v4 as uuidv4 } from "uuid";

type Post = Database["public"]["Tables"]["posts"]["Row"];

interface EditFormProps {
  post: Post;
}

export default function EditForm({ post }: EditFormProps) {
  const router = useRouter();
  const supabase = createClient();

  // Estados dos campos do post
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content || "");
  const [imageUrl, setImageUrl] = useState(post.image_url || "");

  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setFilePreview(URL.createObjectURL(selectedFile));
      setImageUrl("");
    }
  };

  const handleImageUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value);
    setFile(null);
    setFilePreview(null);
  };

  const handleApprove = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("Publicando...");

    let finalImageUrl = imageUrl;

    if (file) {
      setMessage("Enviando imagem...");
      const fileExt = file.name.split(".").pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `processed/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("post-images")
        .upload(filePath, file);

      if (uploadError) {
        setMessage(`Erro no upload da imagem: ${uploadError.message}`);
        setIsSubmitting(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("post-images")
        .getPublicUrl(filePath);

      if (!urlData) {
        setMessage("Erro ao obter URL pública da imagem.");
        setIsSubmitting(false);
        return;
      }
      finalImageUrl = urlData.publicUrl;
    }

    setMessage("Atualizando post...");
    const { error: updateError } = await supabase
      .from("posts")
      .update({
        title: title,
        content: content,
        image_url: finalImageUrl,
        status: "published",
      })
      .eq("id", post.id);

    if (updateError) {
      setMessage(`Erro ao publicar: ${updateError.message}`);
      setIsSubmitting(false);
    } else {
      setMessage("Post publicado com sucesso! Redirecionando...");
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
      }
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
          onChange={handleImageUrlChange}
          placeholder="https://exemplo.com/imagem.jpg"
          className="mt-1 block w-full rounded-md border-gray-300 p-3 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Preview (Link)"
            className="mt-4 w-full rounded-md object-cover"
          />
        )}
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-2 text-sm text-gray-500">OU</span>
        </div>
      </div>

      <div>
        <label
          htmlFor="file-upload"
          className="block text-sm font-medium text-gray-700"
        >
          Upload da sua máquina
        </label>
        <input
          id="file-upload"
          name="file-upload"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="mt-1 block w-full text-sm text-gray-900 file:mr-4 file:rounded-md file:border-0 file:bg-gray-800 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-gray-700"
        />
        {filePreview && (
          <img
            src={filePreview}
            alt="Preview (Upload)"
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
