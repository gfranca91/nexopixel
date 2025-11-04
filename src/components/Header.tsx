import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-4xl font-extrabold text-blue-700">
            NexoPixel
          </Link>
          <nav className="flex space-x-4">
            {["Games", "Animes", "Cinema", "Séries"].map((cat) => (
              <Link
                key={cat}
                href={`/category/${cat.toLowerCase()}`}
                className="font-semibold text-gray-700 hover:text-blue-700"
              >
                {cat}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
