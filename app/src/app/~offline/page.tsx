import { Terminal } from "lucide-react";

export const metadata = {
    title: "Offline | Superteam Academy",
};

export default function Offline() {
    return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center text-center px-4 w-full">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-6 drop-shadow-[0_0_15px_rgba(0,255,148,0.3)] border border-primary/20">
                <Terminal className="h-10 w-10 text-primary" />
            </div>
            <h1 className="font-syne text-4xl font-bold md:text-5xl text-foreground mb-4">
                You are offline
            </h1>
            <p className="font-space text-lg text-muted-foreground max-w-[500px]">
                It looks like you&apos;ve lost your connection. The Superteam Academy PWA requires an internet connection to sync your on-chain progress and load courses.
            </p>
        </div>
    );
}
