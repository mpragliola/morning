export interface CalendarEvent {
  id: string
  summary: string
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
  colorId?: string
  backgroundColor?: string
  location?: string
  description?: string
}

export interface Task {
  id: string
  title: string
  status: 'needsAction' | 'completed'
  due?: string
}

export interface TaskList {
  id: string
  title: string
}

export interface CalendarMeta {
  id: string
  summary: string
  backgroundColor: string
  foregroundColor: string
}
