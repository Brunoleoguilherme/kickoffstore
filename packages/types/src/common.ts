/** Monetary amounts are ALWAYS integer cents (see CLAUDE.md rule 9). */
export type Cents = number

/** ISO-4217 currency code. Clube da Estampa operates in BRL for the MVP. */
export type CurrencyCode = 'BRL'

export type UUID = string

/** Standard API envelope (see docs/01-arquitetura.md §4). */
export interface ApiMeta {
  requestId: UUID
}

export interface ApiSuccess<T> {
  data: T
  error: null
  meta: ApiMeta
}

export interface ApiErrorBody {
  code: string
  message: string
  details?: Record<string, unknown>
}

export interface ApiError {
  data: null
  error: ApiErrorBody
  meta: ApiMeta
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}
