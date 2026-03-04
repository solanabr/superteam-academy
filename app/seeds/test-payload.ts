import { getPayload } from "./utils/payload";

async function main() {
  const p = await getPayload();
  console.log("Payload initialized:", typeof p.find);
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
