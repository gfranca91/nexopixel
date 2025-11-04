"use client";

import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
    setIsSearchOpen(false);
  };

  const handleSearchToggle = () => {
    setIsSearchOpen(!isSearchOpen);
    setIsMenuOpen(false);
  };

  return (
    <header className="border-b relative">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-4xl font-extrabold text-blue-700">
            NexoPixel
          </Link>

          <div className="flex items-center space-x-4 md:space-x-6">
            <nav className="hidden space-x-6 md:flex">
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

            <button
              onClick={handleSearchToggle}
              aria-label="Abrir busca"
              className="text-gray-700 hover:text-blue-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
            </button>

            <div className="flex items-center md:hidden">
              <button onClick={handleMenuToggle} aria-label="Abrir menu">
                {isMenuOpen ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-8 w-8"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-8 w-8"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="absolute z-50 w-full border-b bg-white shadow-lg md:hidden">
          <nav className="flex flex-col space-y-1 p-4">
            {["Games", "Animes", "Cinema", "Séries"].map((cat) => (
              <Link
                key={cat}
                href={`/category/${cat.toLowerCase()}`}
                className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => setIsMenuOpen(false)}
              >
                {cat}
              </Link>
            ))}
          </nav>
        </div>
      )}

      {isSearchOpen && (
        <div className="absolute z-40 w-full border-b bg-white shadow-lg">
          <div className="mx-auto max-w-7xl p-4 md:p-6">
            <form action="/search" method="GET" className="flex items-center">
              <input
                type="text"
                name="query"
                placeholder="Digite o que você procura..."
                className="h-12 w-full grow border-b-2 border-gray-300 bg-transparent text-lg text-gray-900 focus:border-blue-700 focus:outline-none"
                autoFocus
                required
              />
              <button
                type="submit"
                className="ml-4 h-12 rounded-md bg-gray-800 px-6 font-semibold text-white hover:bg-gray-700"
              >
                Buscar
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
