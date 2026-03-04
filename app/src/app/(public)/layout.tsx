import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="md:px-8 w-full max-w-[1800px] mt-24 mr-auto ml-auto pr-4 pb-20 pl-4">
        {children}
      </main>
      <Footer />
    </>
  );
}
