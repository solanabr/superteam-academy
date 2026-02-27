export function Footer() {
  return (
    <footer className="border-t border-[#2E2E36] bg-[#0A0A0F] py-8">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-[#9945FF] to-[#14F195]" />
          <span className="text-sm font-semibold text-white">Superteam Academy</span>
        </div>
        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()} Superteam Brazil. Open Source Education.
        </p>
        <div className="flex gap-4">
           {/* Social links placeholder */}
           <a href="#" className="text-gray-500 hover:text-white transition-colors">Twitter</a>
           <a href="#" className="text-gray-500 hover:text-white transition-colors">Discord</a>
           <a href="#" className="text-gray-500 hover:text-white transition-colors">GitHub</a>
        </div>
      </div>
    </footer>
  );
}
