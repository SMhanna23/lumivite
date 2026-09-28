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

const ARABIC_INDIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"]

// Converts any Western digits (0-9) inside a string/number to Arabic-Indic digits,
// leaving everything else (letters, "PM", punctuation) untouched.
export function toArabicDigits(value) {
  return String(value).replace(/[0-9]/g, d => ARABIC_INDIC_DIGITS[d])
}

// "1 person" / "2 people" / "5 persons" equivalent, e.g. for the RSVP guest-count dropdown.
export function personsLabelAr(n) {
  if (n === 1) return "شخص واحد"
  if (n === 2) return "شخصان"
  return `${toArabicDigits(n)} أشخاص`
}
