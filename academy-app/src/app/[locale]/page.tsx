
import Footer from "~/components/Footer";
import Header from "~/components/Header";
import LandingPageMain from "~/components/LandingPageMain";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center font-sans dark:bg-foreground">
      <Header />
       <LandingPageMain />
      <Footer />
    </div>
  );
}
