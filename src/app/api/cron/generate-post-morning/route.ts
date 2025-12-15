import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { uploadAndProcessImage } from "../../../../lib/uploadImage";
import type { Database } from "../../../../lib/database.types";

type PostInsert = Database["public"]["Tables"]["posts"]["Insert"];

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
    '("filme" OR "cinema") AND ("trailer" OR "crítica" OR "elenco") NOT "fofoca" NOT "política"',
  Séries:
    '"nova temporada" OR "estreia de série" OR "análise de série" OR "elenco" OR "cancelada" OR "atraso filmagem" NOT "política" NOT "fofoca"',
  Animes:
    '("anime" OR "mangá") AND ("review" OR "nova temporada" OR "lançamento") NOT "fofoca" NOT "live action"',
  Games:
    '"review de video game" OR "atualização de patch" OR "bug de jogo" OR "atraso de jogo" OR "elenco de jogo" OR "PlayStation" OR "Xbox" OR "Nintendo" OR "PC Gaming" NOT "polícia" NOT "comparação com vida real" NOT "fofoca"',
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
    const model = genAI.getGenerativeModel({ model: "gemini-3.0-pro" });
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

const getISODate = (date: Date): string => date.toISOString().split("T")[0];

interface WeekDate {
  jsDate: Date;
  dayName: string;
  dateString: string;
}

const getWeeklyDateRange = (): {
  startDateISO: string;
  endDateISO: string;
  weekDates: WeekDate[];
  longStartDate: string;
  longEndDate: string;
  currentYear: string;
} => {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + 6);

  const longFormatter = new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
  });
  const yearFormatter = new Intl.DateTimeFormat("pt-BR", { year: "numeric" });
  const shortFormatter = new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "numeric",
    year: "2-digit",
  });
  const dayFormatter = new Intl.DateTimeFormat("pt-BR", { weekday: "long" });

  let weekDates: WeekDate[] = [];
  for (let i = 0; i <= 6; i++) {
    const day = new Date(startDate);
    day.setDate(day.getDate() + i);
    weekDates.push({
      jsDate: new Date(day.setHours(0, 0, 0, 0)),
      dayName: dayFormatter.format(day),
      dateString: shortFormatter.format(day),
    });
  }

  return {
    startDateISO: getISODate(startDate),
    endDateISO: getISODate(endDate),
    weekDates,
    longStartDate: longFormatter.format(startDate),
    longEndDate: longFormatter.format(endDate),
    currentYear: yearFormatter.format(startDate),
  };
};

type Release = { date: string; title: string; platform: string };

async function getMovieReleases(
  apiKey: string,
  startDate: string,
  endDate: string
): Promise<Release[]> {
  try {
    const url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=pt-BR&region=BR&release_date.gte=${startDate}&release_date.lte=${endDate}&sort_by=popularity.desc`;
    const response = await fetch(url);
    if (!response.ok) {
      console.error("Falha ao buscar TMDB Filmes");
      return [];
    }
    const data = await response.json();
    return (data.results || []).slice(0, 5).map((item: any) => ({
      date: item.release_date,
      title: item.title,
      platform: "Cinema",
    }));
  } catch (e) {
    console.error("Erro no getMovieReleases:", e);
    return [];
  }
}

async function getTvReleases(
  apiKey: string,
  startDate: string,
  endDate: string
): Promise<Release[]> {
  try {
    const url = `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&language=pt-BR&region=BR&first_air_date.gte=${startDate}&first_air_date.lte=${endDate}&sort_by=popularity.desc&with_watch_providers=8|9|337|119|283&watch_region=BR`;

    const response = await fetch(url);
    if (!response.ok) {
      console.error("Falha ao buscar TMDB Séries/Animes");
      return [];
    }
    const data = await response.json();

    return (data.results || []).slice(0, 10).map((item: any) => {
      let platform = "Streaming";
      const providers = item.watch_provider_ids;
      if (providers && providers.length > 0) {
        if (providers.includes(8)) platform = "Netflix";
        else if (providers.includes(9)) platform = "Amazon Prime Video";
        else if (providers.includes(337)) platform = "Disney+";
        else if (providers.includes(119)) platform = "Amazon Prime Video";
        else if (providers.includes(283)) platform = "Crunchyroll";
      }

      return {
        date: item.first_air_date,
        title: item.name,
        platform: platform,
      };
    });
  } catch (e) {
    console.error("Erro no getTvReleases:", e);
    return [];
  }
}

async function getGameReleases(
  apiKey: string,
  startDate: string,
  endDate: string
): Promise<Release[]> {
  try {
    const url = `https://api.rawg.io/api/games?key=${apiKey}&dates=${startDate},${endDate}&ordering=-popularity&page_size=5`;
    const response = await fetch(url);
    if (!response.ok) {
      console.error("Falha ao buscar RAWG Games");
      return [];
    }
    const data = await response.json();
    return (data.results || []).map((item: any) => ({
      date: item.released,
      title: item.name,
      platform:
        item.platforms?.map((p: any) => p.platform.name).join(", ") || "PC",
    }));
  } catch (e) {
    console.error("Erro no getGameReleases:", e);
    return [];
  }
}

async function generateWeeklyRecapPost(
  geminiKey: string,
  tmdbKey: string,
  rawgKey: string,
  authorId: number | null
): Promise<PostInsert | null> {
  if (!authorId) {
    console.error('Autor "Synapse Semanal" não encontrado.');
    return null;
  }

  const {
    startDateISO,
    endDateISO,
    weekDates,
    longStartDate,
    longEndDate,
    currentYear,
  } = getWeeklyDateRange();

  try {
    console.log("PROCESSANDO: Resumo Semanal (Buscando dados reais...)");

    const [movieData, tvData, gameData] = await Promise.all([
      getMovieReleases(tmdbKey, startDateISO, endDateISO),
      getTvReleases(tmdbKey, startDateISO, endDateISO),
      getGameReleases(rawgKey, startDateISO, endDateISO),
    ]);

    const allReleases: Release[] = [...movieData, ...tvData, ...gameData];

    if (allReleases.length === 0) {
      console.log("Nenhum lançamento real encontrado nas APIs.");
      return null;
    }

    let dataForPrompt = "";
    for (const day of weekDates) {
      const dayISO = getISODate(day.jsDate);

      const releasesForThisDay = allReleases.filter((r) => r.date === dayISO);

      dataForPrompt += `## ${day.dayName} (${day.dateString})\n`;

      if (releasesForThisDay.length === 0) {
        dataForPrompt += "* Sem lançamentos notáveis\n";
      } else {
        for (const release of releasesForThisDay) {
          dataForPrompt += `* ${release.title} (${release.platform})\n`;
        }
      }
      dataForPrompt += "\n";
    }

    console.log("PROCESSANDO: Enviando dados pré-formatados para o Gemini.");
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.0-pro" });

    const prompt = `
      Você é o "Radar Semanal", um redator do blog "NexoPixel".
      Sua tarefa é criar um post de blog "Lançamentos da Semana" a partir da lista de dados que vou fornecer.

      REGRAS:
      1. Crie um título chamativo para o post, ex: "Lançamentos da Semana (${longStartDate} a ${longEndDate}): O Que Jogar e Assistir".
      2. O "content" deve começar com uma breve introdução (1 parágrafo).
      3. DEPOIS dessa frase, cole A LISTA DE DADOS PRONTA que eu forneci abaixo, sem NENHUMA alteração.
      4. Crie um slug e 4 tags.
      5. Responda APENAS com um objeto JSON válido.

      LISTA DE DADOS PRONTA (COLE ISSO EXATAMENTE):
      """
      ${dataForPrompt}
      """

      JSON DE SAÍDA:
      {
        "title": "...",
        "content": "...",
        "slug": "${`lancamentos-semana-${getISODate(new Date())}`}",
        "tags": ["Lançamentos", "Games", "Séries", "Cinema"]
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const match = responseText.match(/\{[\s\S]*?\}/);

    if (!match) {
      console.error("Falha no JSON do Gemini para: Resumo Semanal");
      return null;
    }

    const generatedPost: GeneratedPost = JSON.parse(match[0]);

    return {
      title: generatedPost.title,
      content: generatedPost.content,
      slug: generatedPost.slug,
      tags: generatedPost.tags,
      image_url: null,
      status: "draft",
      author_id: authorId,
      category: "Resumo Semanal",
    };
  } catch (error) {
    console.error("Falha ao gerar Resumo Semanal:", error);
    return null;
  }
}

export async function GET(): Promise<NextResponse> {
  console.log("CRON MANHÃ (LOTE): Iniciado");

  try {
    const geminiKey = process.env.GOOGLE_GEMINI_API_KEY;
    const newsApiKey = process.env.NEWS_API_KEY;
    const tmdbKey = process.env.TMDB_API_KEY;
    const rawgKey = process.env.RAWG_API_KEY;

    if (!geminiKey || !newsApiKey || !tmdbKey || !rawgKey) {
      throw new Error("Uma ou mais chaves de API não configuradas.");
    }

    const { data: authors, error: authorsError } = await supabaseAdmin
      .from("authors")
      .select("id, name");

    if (authorsError || !authors) {
      throw new Error("Não foi possível buscar os autores.");
    }

    const authorMap = new Map<string, number>();
    let recapAuthorId: number | null = null;

    authors.forEach((author) => {
      if (author.name === "Synapse Filmes") authorMap.set("Cinema", author.id);
      if (author.name === "Synapse Séries") authorMap.set("Séries", author.id);
      if (author.name === "Synapse Animes") authorMap.set("Animes", author.id);
      if (author.name === "Synapse Games") authorMap.set("Games", author.id);
      if (author.name === "Synapse Semanal") recapAuthorId = author.id;
    });

    const processingPromises: Promise<PostInsert | null>[] = [];

    const isMonday = new Date().getDay() === 1;

    if (isMonday) {
      console.log(
        "CRON MANHÃ (LOTE): É Segunda! Rodando APENAS o Resumo Semanal (com dados reais)..."
      );
      processingPromises.push(
        generateWeeklyRecapPost(geminiKey, tmdbKey, rawgKey, recapAuthorId)
      );
    } else {
      console.log("CRON MANHÃ (LOTE): Rodando 4 categorias diárias...");
      CATEGORY_NAMES.forEach((categoryName) =>
        processingPromises.push(
          processCategory(
            categoryName,
            CATEGORIES[categoryName],
            geminiKey,
            newsApiKey,
            authorMap.get(categoryName) || null
          )
        )
      );
    }

    const newPostsData = await Promise.all(processingPromises);

    const validNewPosts = newPostsData.filter(
      (post) => post !== null
    ) as PostInsert[];

    if (validNewPosts.length === 0) {
      console.log(
        "Nenhum artigo pôde ser processado com sucesso (pode ser normal, sem lançamentos)."
      );
      return NextResponse.json({
        message: "Nenhum artigo processado.",
        posts: [],
      });
    }

    const { data: insertedPosts, error: insertError } = await supabaseAdmin
      .from("posts")
      .insert(validNewPosts)
      .select("title, category");

    if (insertError) {
      throw new Error(`Erro ao salvar posts em lote: ${insertError.message}`);
    }

    console.log(
      `CRON MANHÃ (LOTE): ${insertedPosts.length} posts salvos com sucesso!`
    );

    try {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;
      if (!botToken || !chatId)
        throw new Error("Chaves do Telegram não configuradas.");

      const message = `
🚀 *${insertedPosts.length} Novos Rascunhos Gerados (NexoPixel - MANHÃ)!* 🚀

${insertedPosts
  .map((p) => `*- Categoria:* ${p.category}\n  *Título:* ${p.title}`)
  .join("\n\n")}

👉 [Revisar e publicar](https://nexopixel.vercel.app/admin/dashboard)
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
        "CRON MANHÃ (LOTE): Falha ao enviar notificação do Telegram."
      );
    }

    return NextResponse.json({
      message: `${insertedPosts.length} novos rascunhos criados com sucesso!`,
      posts: insertedPosts,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido";
    console.error("CRON MANHÃ (LOTE): Falha geral na execução.", error);
    return NextResponse.json(
      { ok: false, message: errorMessage },
      { status: 500 }
    );
  }
}
