// Levantine (Lebanese/Syrian/Jordanian) Arabic month names — Syriac-origin,
// not the transliterated ones ("ar-EG" gives مايو for May; Lebanese usage is أيار).
export const LEVANTINE_MONTHS_AR = [
  "كانون الثاني", "شباط", "آذار", "نيسان", "أيار", "حزيران",
  "تموز", "آب", "أيلول", "تشرين الأول", "تشرين الثاني", "كانون الأول",
]

export function arMonthName(date) {
  return LEVANTINE_MONTHS_AR[date.getMonth()]
}

// Mirrors toLocaleDateString("ar-EG", { day: "numeric", month: "long", year?: "numeric" })
// but swaps in the Levantine month name.
export function formatArabicDate(date, { withYear = true } = {}) {
  const day = date.toLocaleDateString("ar-EG", { day: "numeric" })
  const month = arMonthName(date)
  if (!withYear) return `${day} ${month}`
  const year = date.toLocaleDateString("ar-EG", { year: "numeric" })
  return `${day} ${month} ${year}`
}
