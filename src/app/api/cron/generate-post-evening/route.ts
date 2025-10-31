import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { uploadAndProcessImage } from "../../../../lib/uploadImage";
import { setDefaultResultOrder } from "dns";
import type { Database } from "../../../../lib/database.types";

type PostInsert = Database["public"]["Tables"]["posts"]["Insert"];

if (process.env.NODE_ENV === "development") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  setDefaultResultOrder("ipv4first");
}

export const maxDuration = 60;

interface GeneratedPost {
  title: string;
  content: string;
  slug: string;
  tags: string[];
}
interface NewsArticle {
  title: string;
  description: string;
  urlToImage?: string;
  source: {
    name: string;
  };
}

const CATEGORIES: { [key: string]: string } = {
  Cinema:
    '"lançamento de filme" OR "crítica de filme" OR "trailer de filme" NOT "política" NOT "fofoca"',
  Séries:
    '"nova temporada" OR "estreia de série" OR "análise de série" NOT "política"',
  Animes:
    '"novo anime" OR "lançamento de anime" OR "review de anime" OR "Crunchyroll"',
  Games:
    '"lançamento de game" OR "review de video game" OR "atualização de patch" OR "PlayStation" OR "Xbox" OR "Nintendo Switch" OR "PC Gaming" NOT "comparação com vida real"',
};
const CATEGORY_NAMES = Object.keys(CATEGORIES);

async function processCategory(
  category: string,
  query: string,
  geminiKey: string,
  newsApiKey: string,
  authorId: number | null
): Promise<PostInsert | null> {
  if (!authorId) {
    console.error(`Autor não encontrado para a categoria: ${category}`);
    return null;
  }

  try {
    console.log(`PROCESSANDO CATEGORIA: ${category}`);

    const newsResponse = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(
        query
      )}&language=pt&sortBy=publishedAt&pageSize=5&apiKey=${newsApiKey}`
    );
    if (!newsResponse.ok) throw new Error(`NewsAPI falhou para ${category}`);

    const newsData = await newsResponse.json();
    const articles = newsData.articles as NewsArticle[];
    if (articles.length === 0) {
      console.log(`Nenhum artigo encontrado para: ${category}`);
      return null;
    }
    const article = articles[0];

    const processedImageUrl = await uploadAndProcessImage(
      article.urlToImage || ""
    );

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    const prompt = `
      Você é um redator especialista para o blog "NexoPixel" (categoria: ${category}).
      Crie um post de blog a partir da seguinte notícia.
      FOCO: A notícia é sobre a ${category}, não sobre política ou fofocas.
      
      Notícia:
      - Título: ${article.title}
      - Descrição: ${article.description}
      - Fonte: ${article.source.name}
      
      Regras:
      1. Crie um título novo e chamativo.
      2. Escreva um artigo de 4-5 parágrafos.
      3. Crie um slug para a URL.
      4. Sugira um array com 4 tags.
      
      Responda APENAS com um objeto JSON válido:
      {
        "title": "...",
        "content": "...",
        "slug": "...",
        "tags": ["...", "..."]
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const match = responseText.match(/\{[\s\S]*?\}/);

    if (!match) {
      console.error("Falha no JSON do Gemini para:", article.title);
      return null;
    }

    const generatedPost: GeneratedPost = JSON.parse(match[0]);

    return {
      title: generatedPost.title,
      content: generatedPost.content,
      slug: generatedPost.slug,
      tags: generatedPost.tags,
      image_url: processedImageUrl,
      status: "draft",
      author_id: authorId,
      category: category,
    };
  } catch (error) {
    console.error(`Falha ao processar categoria ${category}:`, error);
    return null;
  }
}

export async function GET(): Promise<NextResponse> {
  console.log("CRON TARDE (LOTE POR CATEGORIA): Iniciado");

  try {
    const geminiKey = process.env.GOOGLE_GEMINI_API_KEY;
    const newsApiKey = process.env.NEWS_API_KEY;
    if (!geminiKey || !newsApiKey) {
      throw new Error("Chaves de API (Gemini ou NewsAPI) não configuradas.");
    }

    const { data: authors, error: authorsError } = await supabaseAdmin
      .from("authors")
      .select("id, name");

    if (authorsError || !authors || authors.length < 4) {
      throw new Error("Não foi possível buscar os 4 autores Synapse.");
    }

    const authorMap = new Map<string, number>();
    authors.forEach((author) => {
      if (author.name === "Synapse Filmes") authorMap.set("Cinema", author.id);
      if (author.name === "Synapse Séries") authorMap.set("Séries", author.id);
      if (author.name === "Synapse Animes") authorMap.set("Animes", author.id);
      if (author.name === "Synapse Games") authorMap.set("Games", author.id);
    });

    console.log(
      `CRON TARDE (LOTE): Processando ${CATEGORY_NAMES.length} categorias em paralelo...`
    );

    const processingPromises = CATEGORY_NAMES.map((categoryName) =>
      processCategory(
        categoryName,
        CATEGORIES[categoryName],
        geminiKey,
        newsApiKey,
        authorMap.get(categoryName) || null
      )
    );

    const newPostsData = await Promise.all(processingPromises);

    const validNewPosts = newPostsData.filter(
      (post) => post !== null
    ) as PostInsert[];

    if (validNewPosts.length === 0) {
      throw new Error("Nenhum artigo pôde ser processado com sucesso.");
    }

    const { data: insertedPosts, error: insertError } = await supabaseAdmin
      .from("posts")
      .insert(validNewPosts)
      .select("title, category");

    if (insertError) {
      throw new Error(`Erro ao salvar posts em lote: ${insertError.message}`);
    }

    console.log(
      `CRON TARDE (LOTE): ${insertedPosts.length} posts salvos com sucesso!`
    );

    try {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;
      if (!botToken || !chatId)
        throw new Error("Chaves do Telegram não configuradas.");

      const message = `
🚀 *${insertedPosts.length} Novos Rascunhos Gerados (NexoPixel)!* 🚀

${insertedPosts
  .map((p) => `*- Categoria:* ${p.category}\n  *Título:* ${p.title}`)
  .join("\n\n")}

👉 [Revisar e publicar](httpsU://SEU_SITE_VAI_AQUI.vercel.app/admin/drafts)
      `;

      const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
      await fetch(telegramUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "Markdown",
          disable_web_page_preview: true,
        }),
      });
    } catch (telegramError) {
      console.error(
        "CRON TARDE (LOTE): Falha ao enviar notificação do Telegram."
      );
    }

    return NextResponse.json({
      message: `${insertedPosts.length} novos rascunhos criados com sucesso!`,
      posts: insertedPosts,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido";
    console.error("CRON TARDE (LOTE): Falha geral na execução.", error);
    return NextResponse.json(
      { ok: false, message: errorMessage },
      { status: 500 }
    );
  }
}
