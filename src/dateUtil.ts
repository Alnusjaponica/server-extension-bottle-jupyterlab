export const formatDate = (date: Date): string => {
  const options = {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  }
  // @ts-ignore
  return new Intl.DateTimeFormat("ja-JP", options).format(date)
}
