import type { Connection } from "@solana/web3.js";
import { isDevnetFailClosed } from "@/lib/solana/network";

type GenesisReader = Pick<Connection, "getGenesisHash">;

/**
 * One check per lab connection. A page has one lab connection, so this is one
 * genesis read per page load.
 */
const checks = new WeakMap<GenesisReader, Promise<boolean>>();

/**
 * Whether the lab connection is on devnet, by its genesis hash. The lab sends
 * and signs nothing until this is true: a lab RPC URL that points at another
 * chain must not let a learner spend real SOL.
 *
 * Fails closed: another chain's hash and a failed read are both `false`. The
 * answer is kept for the page load. A failed read is not kept, so the next
 * call reads again.
 */
export function verifyLabDevnet(connection: GenesisReader): Promise<boolean> {
  const cached = checks.get(connection);
  if (cached) return cached;
  const check = isDevnetFailClosed(() => connection.getGenesisHash()).catch(
    () => {
      checks.delete(connection);
      return false;
    }
  );
  checks.set(connection, check);
  return check;
}
