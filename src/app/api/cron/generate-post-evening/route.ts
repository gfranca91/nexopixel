import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { setDefaultResultOrder } from "dns";

export const maxDuration = 30;

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

const CATEGORIES = ["Cinema Geek", "Séries TV", "Animes", "Jogos"];
function getRandomCategory(): string {
  return CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
}

export async function GET(): Promise<NextResponse> {
  if (process.env.NODE_ENV === "development") {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    setDefaultResultOrder("ipv4first");
  }

  console.log("CRON TARDE: Iniciado (20:00 UTC / 17:00 BSB)");

  try {
    const geminiKey = process.env.GOOGLE_GEMINI_API_KEY;
    const newsApiKey = process.env.NEWS_API_KEY;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!geminiKey || !newsApiKey || !botToken || !chatId) {
      throw new Error(
        "Chaves de API (Gemini, NewsAPI ou Telegram) não configuradas."
      );
    }

    const today = new Date();
    const isMonday = today.getDay() === 1;

    if (isMonday) {
    }

    const category = getRandomCategory();
    console.log(`CRON TARDE: Buscando notícias para a categoria: ${category}`);

    const newsResponse = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(
        category
      )}&language=pt&sortBy=publishedAt&pageSize=10&apiKey=${newsApiKey}`
    );

    if (!newsResponse.ok)
      throw new Error("Falha ao buscar notícias da NewsAPI.");
    const newsData = await newsResponse.json();
    const articles = newsData.articles as NewsArticle[];

    if (articles.length === 0) {
      return NextResponse.json({
        message: `Nenhuma notícia encontrada para: ${category}`,
      });
    }

    const articleToProcess =
      articles[Math.floor(Math.random() * articles.length)];
    const imageUrl = articleToProcess.urlToImage || "";

    console.log(
      `CRON MANHÃ: Gerando post com base em: ${articleToProcess.title}`
    );
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    const prompt = `
      Você é um redator para o blog de cultura geek "NexoPixel".
      Crie um post de blog a partir da seguinte notícia.
      
      Notícia:
      - Título: ${articleToProcess.title}
      - Descrição: ${articleToProcess.description}
      - Fonte: ${articleToProcess.source.name}
      
      Regras:
      1. Crie um título novo e chamativo para o blog "NexoPixel".
      2. Escreva um artigo de 4-5 parágrafos em português.
      3. Crie um slug para a URL (ex: 'novo-filme-do-batman').
      4. Sugira um array com 4 tags relevantes (ex: "Cinema", "DC", "Batman").
      
      Sua resposta deve ser APENAS um objeto JSON válido, sem nenhum texto antes ou depois. Use a seguinte estrutura:
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
      throw new Error(
        "Nenhum objeto JSON válido encontrado na resposta do Gemini."
      );
    }

    let generatedPost: GeneratedPost;
    try {
      generatedPost = JSON.parse(match[0]);
    } catch (err) {
      throw new Error("Falha ao fazer parse do JSON gerado pelo Gemini.");
    }

    const { data: authors, error: authorsError } = await supabaseAdmin
      .from("authors")
      .select("id");

    if (authorsError || !authors || authors.length === 0) {
      throw new Error("Não foi possível buscar autores.");
    }
    const randomAuthorId =
      authors[Math.floor(Math.random() * authors.length)].id;

    const { data: newPost, error: insertError } = await supabaseAdmin
      .from("posts")
      .insert({
        title: generatedPost.title,
        content: generatedPost.content,
        slug: generatedPost.slug,
        tags: generatedPost.tags,
        image_url: imageUrl,
        status: "draft",
        author_id: randomAuthorId,
        category: category,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Erro ao salvar no Supabase:", insertError.message);
      throw new Error(`Erro ao salvar no Supabase: ${insertError.message}`);
    }

    if (!newPost) {
      throw new Error("Post não foi criado ou retornado pelo Supabase.");
    }

    console.log(`CRON MANHÃ: Post salvo! ID: ${newPost.id}`);

    const message = `
🚀 *Novo Rascunho Gerado (NexoPixel)!* 🚀

*Título:* ${newPost.title}
*Categoria:* ${newPost.category}

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

    return NextResponse.json({
      message: "Novo rascunho de post criado e notificação enviada!",
      post: newPost,
    });
  } catch (error: unknown) {
    console.error("CRON MANHÃ: FALHA GERAL. OBJETO DO ERRO COMPLETO:");
    console.error(error);

    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido";

    let fullErrorMessage = errorMessage;
    if (error instanceof Error && error.cause) {
      fullErrorMessage = `${errorMessage} | Causa-Raiz: ${error.cause}`;
    }

    console.error("CRON MANHÃ: Falha geral na execução.", fullErrorMessage);

    return NextResponse.json(
      { ok: false, message: fullErrorMessage },
      { status: 500 }
    );
  }
}
