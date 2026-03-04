export function sumArray<T>(array: T[], func: (item: T) => number) {
  return array.reduce((acc, item) => acc + func(item), 0)
}
