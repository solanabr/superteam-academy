/**
 * Truncates a string (like a public key) to show the first and last few characters.
 * @param str The string to truncate
 * @param startChars Number of characters to keep at the start (default 4)
 * @param endChars Number of characters to keep at the end (default 4)
 * @returns The truncated string, e.g. '7xKX...4mNp'
 */
export const truncateAddress = (
  str: string | undefined | null,
  startChars = 4,
  endChars = 4,
) => {
  if (!str) return ''
  if (str.length <= startChars + endChars) return str
  return `${str.slice(0, startChars)}...${str.slice(-endChars)}`
}
