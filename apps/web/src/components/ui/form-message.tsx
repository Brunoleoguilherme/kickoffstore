export function FormMessage({ error, success }: { error?: string; success?: string }) {
  if (error) {
    return (
      <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
        {error}
      </p>
    )
  }
  if (success) {
    return (
      <p role="status" className="rounded-md bg-brand-50 px-3 py-2 text-sm text-brand-700">
        {success}
      </p>
    )
  }
  return null
}
