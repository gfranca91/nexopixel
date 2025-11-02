import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-12 border-t bg-gray-900 p-8 text-gray-400">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div>
            <h3 className="text-2xl font-bold text-white">NexoPixel</h3>
            <p className="mt-2 max-w-xs">
              Seu hub de notícias sobre games, animes, cinema e tv, gerado por
              IA e curado por humanos.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold uppercase text-white">
              Siga-nos
            </h3>
            <div className="mt-4 flex space-x-4">
              <a href="#" className="hover:text-white">
                Facebook
              </a>
              <a href="#" className="hover:text-white">
                Instagram
              </a>
              <a
                href="https://github.com/SEU_USUARIO/nexopixel"
                className="hover:text-white"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-800 pt-4 text-center text-sm">
          <p>
            © {new Date().getFullYear()} NexoPixel. Todos os direitos
            reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
