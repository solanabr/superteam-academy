/**
 * How a sandboxed `console.log` prints its arguments, shared by the browser's
 * worker and the server's executor. It's source text rather than a function
 * because both paste it into the code they run in their sandbox.
 *
 * A log line must never change a verdict, so nothing in here may throw: JSON
 * rejects a BigInt or a cycle, and a getter, a `toJSON` or an object with no
 * prototype can throw on the way to a string.
 */
export const CONSOLE_FORMAT_SOURCE = String.raw`
function __stringify__(value, indent) {
  try {
    return JSON.stringify(value, function (_key, v) {
      return typeof v === "bigint" ? v.toString() + "n" : v;
    }, indent);
  } catch (_err) {
    try {
      return String(value);
    } catch (_err2) {
      return "[unprintable]";
    }
  }
}

function __formatLogArg__(value) {
  if (typeof value === "object") return __stringify__(value);
  if (typeof value === "bigint") return value.toString() + "n";
  try {
    return String(value);
  } catch (_err) {
    return "[unprintable]";
  }
}
`;
