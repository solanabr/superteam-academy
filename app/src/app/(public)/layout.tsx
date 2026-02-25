import { Footer } from "@/components/landing/footer";
// Простой лейаут с хедером (можно упрощенным) и футером
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
       {/* Можно добавить Header с кнопкой Home */}
       <main className="flex-1">{children}</main>
       <Footer />
    </div>
  );
}