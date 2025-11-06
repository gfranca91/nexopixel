# NexoPixel: AI-Generated, Human-Curated News Hub

**Live Demo:** [**https://nexopixel.vercel.app/**](https://nexopixel.vercel.app/)

[![Next.js](https://img.shields.io/badge/Next.js-14+-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.io/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

An advanced full-stack geek news portal (covering games, anime, cinema, and TV) built with Next.js 14 (App Router) and Supabase. The project's core feature is a robust, parallel-processing automation pipeline that uses AI (Google Gemini) to generate daily content, which is then managed by a human admin via a secure, custom-built CMS.

---

## 🚀 About The Project (Sobre o Projeto)

This project was built from the ground up to demonstrate a robust full-stack architecture. The primary goal was to create a "zero-maintenance" content site. It achieves this via Vercel Cron Jobs that trigger a serverless backend pipeline.

This pipeline, built on Next.js API Routes, executes multiple tasks **in parallel** (using `Promise.all`):

1.  **Fetches** real-world news from the NewsAPI for 4 different categories.
2.  **Processes** each article's image using the `sharp` library (resizing, cropping to 1:1) and uploads it to Supabase Storage.
3.  **Generates** new, original blog posts by feeding the news data into Google Gemini Pro with highly specific, role-based prompts.
4.  **Creates** a special "Weekly Recap" post every Monday using a separate, data-aware Gemini prompt.
5.  **Saves** all generated content as `drafts` in the PostgreSQL database.
6.  **Notifies** the admin of new drafts via a Telegram bot.

A "human-in-the-loop" (the admin) then logs into a secure dashboard to review, edit, and publish the AI-generated content.

---

## ✨ Features (Funcionalidades)

- **Automated Content Pipeline:** Daily Cron Jobs (Morning & Afternoon) generate content automatically.
- **AI-Powered Generation:** Uses Google Gemini (`gemini-2.5-pro`) with advanced prompt engineering to generate structured JSON output for both news re-writing and original content (weekly recaps).
- **Parallel Processing:** Uses `Promise.all()` to process all categories simultaneously, respecting Vercel's `maxDuration = 60` limit.
- **Backend Image Processing:** A server-side pipeline downloads, resizes (with `sharp`), and uploads images to Supabase Storage.
- **Secure Admin Panel & CMS:** A protected `/admin` route (using Next.js Middleware) with full CRUD (Create, Read, Update, Delete) functionality for all posts.
- **Dynamic Frontend (App Router):**
  - Fully responsive `page.tsx` with a modern, multi-grid layout.
  - Dynamic pages for posts (`[slug]`) and categories (`[category]`).
  - Advanced pagination with offsets on `/posts` and `/releases` pages.
  - Server-side search functionality (`/search`) querying the database.
- **Polished UI/UX:** A complex `"use client"` Header with a responsive hamburger menu and a "click-to-reveal" search overlay.
- **Telegram Notifications:** Integrated bot notifies admin of new drafts.

---

## 🛠️ Tech Stack (Tecnologias Utilizadas)

| Category             | Technology                         |
| :------------------- | :--------------------------------- |
| **Framework**        | **Next.js 14+** (App Router)       |
| **Language**         | **TypeScript**                     |
| **Styling**          | **Tailwind CSS**                   |
| **Database**         | **Supabase** (PostgreSQL)          |
| **Auth**             | **Supabase Auth** (Email/Password) |
| **File Storage**     | **Supabase Storage**               |
| **AI**               | **Google Gemini Pro**              |
| **Data Source**      | **NewsAPI.org**                    |
| **Automation**       | **Vercel Cron Jobs**               |
| **Deployment**       | **Vercel**                         |
| **Image Processing** | `sharp`                            |
| **Rendering**        | `react-markdown`                   |

---

## 🏛️ Architecture & Key Concepts (Arquitetura e Conceitos-Chave)

This project demonstrates several advanced architecture patterns:

1.  **Security (RLS & Dual Clients):** The application uses two Supabase clients.

    - **Client-Side (Public):** A read-only `anon` client, heavily restricted by **Row Level Security (RLS)** policies in PostgreSQL. The public can _only_ `SELECT` posts where `status = 'published'`.
    - **Server-Side (Admin):** A `supabaseAdmin` client (using the `service_role` key) in API Routes and Server Components. This client bypasses RLS to perform administrative tasks (like saving drafts), guaranteeing a secure separation of concerns.

2.  **Server-Side Data Fetching:** All data fetching is done on the server using Server Components, `async/await`, and server-side route handlers, ensuring the client receives fast, pre-rendered HTML.

3.  **Protected Routes (Middleware):** The entire admin dashboard (`/admin/**`) is protected using Next.js `middleware.ts`. It verifies the user's auth session and redirects them to `/login` if they are not authenticated.

4.  **Parallel Backend-for-Frontend (BFF):** The Cron Job API routes act as a BFF, orchestrating multiple complex tasks (`Promise.all`) to feed data to the frontend, all while managing platform time limits (`maxDuration`).

---

## 🚀 Getting Started (Como Rodar o Projeto)

1.  **Clone the repository:**

    ```bash
    git clone [https://github.com/gfranca91/nexopixel.git](https://github.com/gfranca91/nexopixel.git)
    cd nexopixel
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up your environment:**
    Create a `.env.local` file in the root and add all the required Supabase, API, and Admin credentials:

    ```env
    # Supabase (find these in your Supabase project settings)
    NEXT_PUBLIC_SUPABASE_URL=...
    NEXT_PUBLIC_SUPABASE_ANON_KEY=...
    SUPABASE_SERVICE_ROLE_KEY=...

    # APIs (get these from their respective developer dashboards)
    GOOGLE_GEMINI_API_KEY=...
    NEWS_API_KEY=...

    # Admin (your email, for middleware to protect /admin)
    ADMIN_EMAIL=seu-email@gmail.com

    # Telegram (for bot notifications)
    TELEGRAM_BOT_TOKEN=...
    TELEGRAM_CHAT_ID=...
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

---

---

<br/>
<br/>
<br/>

# NexoPixel: Hub de Notícias Gerado por IA, Curado por Humanos

**Demo ao Vivo:** [**https://nexopixel.vercel.app/**](https://nexopixel.vercel.app/)

[![Next.js](https://img.shields.io/badge/Next.js-14+-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.io/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

Um portal de notícias geek full-stack avançado (cobrindo games, animes, cinema e TV) construído com Next.js 14 (App Router) e Supabase. A funcionalidade principal do projeto é um pipeline de automação robusto e com processamento paralelo que usa IA (Google Gemini) para gerar conteúdo diário, que é então gerenciado por um administrador humano através de um CMS seguro e customizado.

---

## 🚀 Sobre o Projeto

Este projeto foi construído do zero para demonstrar uma arquitetura full-stack robusta. O objetivo principal era criar um site de conteúdo "zero manutenção". Ele alcança isso através de Cron Jobs da Vercel que disparam um pipeline de backend serverless.

Esse pipeline, construído sobre as API Routes do Next.js, executa múltiplas tarefas **em paralelo** (usando `Promise.all`):

1.  **Busca** notícias do mundo real na NewsAPI para 4 categorias diferentes.
2.  **Processa** a imagem de cada artigo usando a biblioteca `sharp` (redimensionando, cortando para 1:1) e faz o upload para o Supabase Storage.
3.  **Gera** novos posts de blog originais, fornecendo os dados da notícia ao Google Gemini Pro com prompts altamente específicos e baseados em "personas".
4.  **Cria** um post especial de "Resumo Semanal" toda segunda-feira, usando um prompt separado e consciente dos dados.
5.  **Salva** todo o conteúdo gerado como `drafts` (rascunhos) no banco de dados PostgreSQL.
6.  **Notifica** o administrador sobre novos rascunhos através de um bot do Telegram.

Um "humano-no-circuito" (o administrador) então entra em um painel seguro para revisar, editar e publicar o conteúdo gerado pela IA.

---

## ✨ Funcionalidades

- **Pipeline de Conteúdo Automatizado:** Cron Jobs diários (Manhã e Tarde) geram conteúdo automaticamente.
- **Geração por IA:** Usa o Google Gemini (`gemini-2.5-pro`) com engenharia de prompt avançada para gerar JSON estruturado, tanto para reescrever notícias quanto para criar conteúdo original (resumos semanais).
- **Processamento Paralelo:** Usa `Promise.all()` para processar todas as categorias simultaneamente, respeitando o limite de `maxDuration = 60` da Vercel.
- **Processamento de Imagem no Backend:** Um pipeline server-side baixa, redimensiona (com `sharp`) e faz upload de imagens para o Supabase Storage.
- **Painel de Admin Seguro & CMS:** Uma rota `/admin` protegida (usando Middleware do Next.js) com funcionalidade completa de CRUD (Create, Read, Update, Delete) para todos os posts.
- **Frontend Dinâmico (App Router):**
  - `page.tsx` totalmente responsiva com um layout de grid moderno e complexo.
  - Páginas dinâmicas para posts (`[slug]`) e categorias (`[category]`).
  - Paginação avançada com _offsets_ nas páginas `/posts` e `/releases`.
  - Funcionalidade de busca (`/search`) renderizada no servidor.
- **UI/UX Polida:** Um Header complexo (`"use client"`) com menu hambúrguer responsivo e um _overlay_ de busca "click-to-reveal".
- **Notificações via Telegram:** Bot integrado notifica o admin sobre novos rascunhos.

---

## 🛠️ Tecnologias Utilizadas

| Categoria                   | Tecnologia                      |
| :-------------------------- | :------------------------------ |
| **Framework**               | **Next.js 14+** (App Router)    |
| **Linguagem**               | **TypeScript**                  |
| **Estilização**             | **Tailwind CSS**                |
| **Banco de Dados**          | **Supabase** (PostgreSQL)       |
| **Autenticação**            | **Supabase Auth** (Email/Senha) |
| **Armazenamento**           | **Supabase Storage**            |
| **IA**                      | **Google Gemini Pro**           |
| **Fonte de Dados**          | **NewsAPI.org**                 |
| **Automação**               | **Vercel Cron Jobs**            |
| **Deploy**                  | **Vercel**                      |
| **Processamento de Imagem** | `sharp`                         |
| **Renderização**            | `react-markdown`                |

---

## 🏛️ Arquitetura e Conceitos-Chave

Este projeto demonstra vários padrões de arquitetura avançados:

1.  **Segurança (RLS & Clientes Duplos):** A aplicação usa dois clientes Supabase.

    - **Lado do Cliente (Público):** Um cliente `anon` (anônimo) somente leitura, fortemente restringido por políticas de **RLS (Row Level Security)** no PostgreSQL. O público só pode fazer `SELECT` em posts com `status = 'published'`.
    - **Lado do Servidor (Admin):** Um cliente `supabaseAdmin` (usando a `service_role` key) nas API Routes e Server Components. Este cliente ignora o RLS para realizar tarefas administrativas (como salvar rascunhos), garantindo uma separação segura de responsabilidades.

2.  **Data Fetching no Servidor:** Toda a busca de dados é feita no servidor usando Server Components, `async/await` e _route handlers_ server-side, garantindo que o cliente receba um HTML rápido e pré-renderizado.

3.  **Rotas Protegidas (Middleware):** Todo o painel de admin (`/admin/**`) é protegido usando `middleware.ts` do Next.js. Ele verifica a sessão de autenticação do usuário e o redireciona para `/login` se não estiver autenticado.

4.  **Backend-for-Frontend (BFF) Paralelo:** As API Routes do Cron Job atuam como um BFF, orquestrando múltiplas tarefas complexas (`Promise.all`) para alimentar o frontend, tudo isso gerenciando os limites de tempo da plataforma (`maxDuration`).

---

## 🚀 Como Rodar o Projeto

1.  **Clone o repositório:**

    ```bash
    git clone [https://github.com/gfranca91/nexopixel.git](https://github.com/gfranca91/nexopixel.git)
    cd nexopixel
    ```

2.  **Instale as dependências:**

    ```bash
    npm install
    ```

3.  **Configure seu ambiente:**
    Crie um arquivo `.env.local` na raiz do projeto e adicione todas as credenciais necessárias do Supabase, APIs e Admin:

    ```env
    # Supabase (encontre no painel do seu projeto Supabase)
    NEXT_PUBLIC_SUPABASE_URL=...
    NEXT_PUBLIC_SUPABASE_ANON_KEY=...
    SUPABASE_SERVICE_ROLE_KEY=...

    # APIs (obtenha nos seus respectivos painéis de desenvolvedor)
    GOOGLE_GEMINI_API_KEY=...
    NEWS_API_KEY=...

    # Admin (seu email, para o middleware proteger o /admin)
    ADMIN_EMAIL=seu-email@gmail.com

    # Telegram (para notificações do bot)
    TELEGRAM_BOT_TOKEN=...
    TELEGRAM_CHAT_ID=...
    ```

4.  **Rode o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```

---
