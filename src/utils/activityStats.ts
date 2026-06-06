import type { RecordedTrip } from '../types/trip'

export interface ActivityChartDatum {
  label: string
  value: number
}

export interface ActivityChartsData {
  distanceByDate: ActivityChartDatum[]
  tripsByDate: ActivityChartDatum[]
}

const MAX_DISTANCE_POINTS = 7
const MAX_ACTIVITY_POINTS = 7

function padNumber(value: number) {
  return value.toString().padStart(2, '0')
}

function getTripActivityDate(trip: Pick<RecordedTrip, 'ended_at' | 'started_at'>) {
  const rawDate = trip.ended_at ?? trip.started_at
  const parsedDate = new Date(rawDate)

  if (Number.isNaN(parsedDate.getTime())) {
    return null
  }

  return parsedDate
}

function getDateKey(date: Date) {
  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`
}

function formatDateLabel(date: Date) {
  return `${padNumber(date.getDate())}/${padNumber(date.getMonth() + 1)}`
}

export function buildActivityChartsData(trips: RecordedTrip[]): ActivityChartsData {
  const distanceByDateMap = new Map<string, { date: Date; distanceKm: number }>()
  const tripsByDateMap = new Map<string, { date: Date; count: number }>()

  for (const trip of trips) {
    const activityDate = getTripActivityDate(trip)

    if (!activityDate) {
      continue
    }

    const distanceKm = Math.max(0, Number(trip.distance_m ?? 0)) / 1000
    const dateKey = getDateKey(activityDate)
    const existingDate = distanceByDateMap.get(dateKey)

    distanceByDateMap.set(dateKey, {
      date: existingDate?.date ?? activityDate,
      distanceKm: (existingDate?.distanceKm ?? 0) + distanceKm,
    })

    const existingTripCount = tripsByDateMap.get(dateKey)

    tripsByDateMap.set(dateKey, {
      date: existingTripCount?.date ?? activityDate,
      count: (existingTripCount?.count ?? 0) + 1,
    })
  }

  const distanceByDate = Array.from(distanceByDateMap.values())
    .sort((left, right) => left.date.getTime() - right.date.getTime())
    .slice(-MAX_DISTANCE_POINTS)
    .map((item) => ({
      label: formatDateLabel(item.date),
      value: Number(item.distanceKm.toFixed(2)),
    }))

  const tripsByDate = Array.from(tripsByDateMap.values())
    .sort((left, right) => left.date.getTime() - right.date.getTime())
    .slice(-MAX_ACTIVITY_POINTS)
    .map((item) => ({
      label: formatDateLabel(item.date),
      value: item.count,
    }))

  return {
    distanceByDate,
    tripsByDate,
  }
}
