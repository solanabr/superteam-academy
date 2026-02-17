import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-background text-foreground">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Superteam Academy
        </p>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
          <WalletMultiButton className="bg-primary text-white border-3 border-black shadow-neo hover:shadow-neo-hover transition-all" />
        </div>
      </div>

      <div className="relative flex place-items-center">
        <h1 className="text-6xl font-black uppercase tracking-tighter text-center">
          Learn Solana <br />
          <span className="text-primary bg-accent px-4 py-2 border-3 border-black shadow-neo -rotate-2 inline-block">
            The Hard Way
          </span>
        </h1>
      </div>

      <div className="mb-32 grid text-center lg:mb-0 lg:w-full lg:max-w-5xl lg:grid-cols-4 lg:text-left gap-8">
        <div className="group rounded-none border-3 border-black bg-white p-5 transition-all hover:-translate-y-1 hover:shadow-neo shadow-none">
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Courses{" "}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Deep dive into Solana development with our curated courses.
          </p>
        </div>

        <div className="group rounded-none border-3 border-black bg-secondary text-white p-5 transition-all hover:-translate-y-1 hover:shadow-neo shadow-none">
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Build{" "}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-90`}>
            Start building your dApps today with hands-on projects.
          </p>
        </div>

        <div className="group rounded-none border-3 border-black bg-warning p-5 transition-all hover:-translate-y-1 hover:shadow-neo shadow-none">
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Earn{" "}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Earn rewards and reputation as you learn and contribute.
          </p>
        </div>
      </div>
    </main>
  );
}
