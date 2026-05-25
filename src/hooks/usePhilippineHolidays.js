import { useCallback, useState } from 'react'

const HOLIDAY_API_BASE = 'https://date.nager.at/api/v3/PublicHolidays'

// Calculate Easter Sunday using the Anonymous Gregorian algorithm
function getEasterDate(year) {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

// Get nth Sunday of a month (e.g., 2nd Sunday of May for Mother's Day)
function getNthSundayOfMonth(year, month, n) {
  const firstDay = new Date(year, month, 1)
  const firstSunday = 1 + (7 - firstDay.getDay()) % 7
  return new Date(year, month, firstSunday + (n - 1) * 7)
}

// Format date as YYYY-MM-DD
function formatDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Universal holidays celebrated worldwide
function getUniversalHolidays(year) {
  const holidays = [
    {
      id: `universal-${year}-0101`,
      date: formatDateKey(new Date(year, 0, 1)),
      name: "New Year's Day",
      source: 'universal',
    },
    {
      id: `universal-${year}-0214`,
      date: formatDateKey(new Date(year, 1, 14)),
      name: "Valentine's Day",
      source: 'universal',
    },
    {
      id: `universal-${year}-1031`,
      date: formatDateKey(new Date(year, 9, 31)),
      name: 'Halloween',
      source: 'universal',
    },
    {
      id: `universal-${year}-1224`,
      date: formatDateKey(new Date(year, 11, 24)),
      name: 'Christmas Eve',
      source: 'universal',
    },
    {
      id: `universal-${year}-1225`,
      date: formatDateKey(new Date(year, 11, 25)),
      name: 'Christmas Day',
      source: 'universal',
    },
    {
      id: `universal-${year}-1231`,
      date: formatDateKey(new Date(year, 11, 31)),
      name: "New Year's Eve",
      source: 'universal',
    },
  ]

  // Easter Sunday
  const easter = getEasterDate(year)
  holidays.push({
    id: `universal-${year}-easter`,
    date: formatDateKey(easter),
    name: 'Easter Sunday',
    source: 'universal',
  })

  // Mother's Day - 2nd Sunday of May
  const mothersDay = getNthSundayOfMonth(year, 4, 2)
  holidays.push({
    id: `universal-${year}-mothers`,
    date: formatDateKey(mothersDay),
    name: "Mother's Day",
    source: 'universal',
  })

  // Father's Day - 3rd Sunday of June
  const fathersDay = getNthSundayOfMonth(year, 5, 3)
  holidays.push({
    id: `universal-${year}-fathers`,
    date: formatDateKey(fathersDay),
    name: "Father's Day",
    source: 'universal',
  })

  return holidays
}

async function fetchPhilippineHolidaysForYear(year) {
  const response = await fetch(`${HOLIDAY_API_BASE}/${year}/PH`)
  if (!response.ok) {
    throw new Error(`Failed to fetch Philippine holidays for ${year}`)
  }
  const data = await response.json()
  return data.map((holiday) => ({
    id: `ph-${holiday.date}`,
    date: holiday.date,
    name: holiday.name,
    localName: holiday.localName,
    countryCode: holiday.countryCode,
    source: 'ph',
  }))
}

export function usePhilippineHolidays() {
  const [holidays, setHolidays] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [loadedYears, setLoadedYears] = useState(new Set())

  const fetchHolidays = useCallback(async (year) => {
    const yearStr = String(year)
    if (loadedYears.has(yearStr)) {
      return holidays.filter((h) => h.date.startsWith(yearStr))
    }

    setLoading(true)
    setError(null)

    try {
      const [phHolidays, universalHolidays] = await Promise.all([
        fetchPhilippineHolidaysForYear(year),
        Promise.resolve(getUniversalHolidays(year)),
      ])

      const yearHolidays = [...phHolidays, ...universalHolidays]
      setHolidays((prev) => {
        const existing = prev.filter((h) => !h.date.startsWith(yearStr))
        return [...existing, ...yearHolidays]
      })
      setLoadedYears((prev) => new Set([...prev, yearStr]))
      return yearHolidays
    } catch (err) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [holidays, loadedYears])

  const getHolidayForDate = useCallback((dateKey) => {
    return holidays.find((h) => h.date === dateKey) || null
  }, [holidays])

  const getHolidaysForYear = useCallback((year) => {
    const yearStr = String(year)
    return holidays.filter((h) => h.date.startsWith(yearStr))
  }, [holidays])

  return {
    holidays,
    loading,
    error,
    fetchHolidays,
    getHolidayForDate,
    getHolidaysForYear,
  }
}
