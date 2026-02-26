import { Connection, PublicKey } from "@solana/web3.js";

const PROGRAM_ID = new PublicKey("FEjumbmTCGxTwqikEcyC13czHfTwsnk7B9erNEEuHeBB");
const learner = new PublicKey("8NCLTHTiHJsgDoKyydY8vQfyi8RPDU4P59pCUHQGrBFm");
const courseIds = [
  "getting-started-with-solana",
  "solana-getting-started",
  "getting-started",
];

const conn = new Connection(
  "https://devnet.helius-rpc.com/?api-key=44daf6b7-435a-4124-95e4-f5eaa32ff810",
  "confirmed",
);

async function main() {
  for (const courseId of courseIds) {
    const [enrollPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("enrollment"), Buffer.from(courseId), learner.toBuffer()],
      PROGRAM_ID,
    );
    const [coursePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("course"), Buffer.from(courseId)],
      PROGRAM_ID,
    );

    const courseAcc = await conn.getAccountInfo(coursePda);
    const enrollAcc = await conn.getAccountInfo(enrollPda);

    console.log(courseId);
    console.log("  course exists:", Boolean(courseAcc));
    console.log("  enroll exists:", Boolean(enrollAcc));

    if (courseAcc) {
      const d = courseAcc.data;
      const idLen = d.readUInt32LE(8);
      const storedId = d.subarray(12, 12 + idLen).toString();
      const lcOff = 8 + 4 + idLen + 32 + 32 + 2;
      console.log("  storedId:", storedId, " lessonCount:", d.readUInt8(lcOff));
    }

    if (enrollAcc) {
      const d = enrollAcc.data;
      console.log("  dataLen:", d.length);
      console.log("  hex[40:90]:", d.subarray(40, 90).toString("hex"));
      const tag = d[48];
      console.log("  byte[48] (option tag):", tag);
      const fOff = 48 + 1 + (tag === 1 ? 8 : 0);
      console.log("  flagsOffset:", fOff);
      for (let i = 0; i < 4; i++) {
        let v = BigInt(0);
        for (let b = 0; b < 8; b++) {
          v |= BigInt(d[fOff + i * 8 + b]) << BigInt(b * 8);
        }
        console.log(`  flags[${i}]:`, v.toString());
      }
    }
    console.log("---");
  }
}

main().catch(console.error);
