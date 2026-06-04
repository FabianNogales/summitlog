interface DateTitleOptions {
  locale?: Intl.LocalesArgument
  dateOptions?: Intl.DateTimeFormatOptions
}

function formatDateLabel(date: Date, options: DateTitleOptions) {
  if (options.locale || options.dateOptions) {
    return date.toLocaleDateString(options.locale, options.dateOptions)
  }

  return date.toLocaleDateString()
}

export function formatRecordedTripFallbackTitle(
  startedAt?: string | null,
  options: DateTitleOptions = {}
) {
  const date = startedAt ? new Date(startedAt) : null

  if (date && Number.isFinite(date.getTime())) {
    return `Recorrido del ${formatDateLabel(date, options)}`
  }

  return 'Recorrido registrado'
}

export function formatRecordedTripTitleFromDate(
  value?: string | null,
  options: DateTitleOptions = {}
) {
  const date = value ? new Date(value) : null

  if (date && Number.isFinite(date.getTime())) {
    return `Recorrido del ${formatDateLabel(date, options)}`
  }

  return null
}