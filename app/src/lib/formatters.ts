export function formatPlural(
  count: number,
  { singular, plural }: { singular: string; plural: string },
  { includeCount = true } = {}
) {
  const word = count === 1 ? singular : plural

  return includeCount ? `${count} ${word}` : word
}

export function formatPrice(amount: number, { showZeroAsNumber = false } = {}) {
  const formatter = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  })

  if (amount === 0 && !showZeroAsNumber) return "Free"
  return formatter.format(amount)
}

const DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
})

export function formatDate(date: Date) {
  return DATE_FORMATTER.format(date)
}

export function formatNumber(
  number: number,
  options?: Intl.NumberFormatOptions
) {
  const formatter = new Intl.NumberFormat(undefined, options)
  return formatter.format(number)
}