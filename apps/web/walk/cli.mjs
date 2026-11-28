// Entry point: pnpm --filter web walk <command>. See docs/WALK-ENV.md.

const load = (file) => import(`./${file}.mjs`);

const COMMANDS = {
  up: {
    help: "start the local Supabase stack, seed it, write .env.walk",
    run: async () => {
      (await load("stack")).up();
      await (await load("seed")).seed();
      (await load("env")).writeEnv();
    },
  },
  seed: {
    help: "create or update the test users",
    run: async () => (await load("seed")).seed(),
  },
  env: {
    help: "write apps/web/.env.walk again",
    run: async () => (await load("env")).writeEnv(),
  },
  dev: {
    help: "start the app and the build stub",
    run: async () => (await load("dev")).dev(),
  },
  session: {
    help: "sign in a test user (learner | admin), save the browser session",
    run: async (role) => (await load("session")).writeSession(role),
  },
  stub: {
    help: "start only the build stub",
    run: async () => {
      const { BUILD_SERVER_API_KEY } = (await load("lib")).readEnvFile();
      (await load("build-stub")).startBuildStub({
        apiKey: BUILD_SERVER_API_KEY,
      });
    },
  },
  smoke: {
    help: "check the running walk app in a browser",
    run: async () => (await load("smoke")).smoke(),
  },
  status: {
    help: "say if the stack is up",
    run: async () => (await load("stack")).status(),
  },
  down: {
    help: "stop the stack, keep its data",
    run: async () => (await load("stack")).down(),
  },
  wipe: {
    help: "stop the stack and delete its data",
    run: async () => (await load("stack")).wipe(),
  },
};

const [name, ...args] = process.argv.slice(2);
const command = COMMANDS[name];
if (!command) {
  console.error("Usage: pnpm --filter web walk <command>\n");
  for (const [key, { help }] of Object.entries(COMMANDS)) {
    console.error(`  ${key.padEnd(8)} ${help}`);
  }
  process.exit(name ? 1 : 0);
}
await command.run(...args);
