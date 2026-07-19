import { Wordmark } from '@/components/brand/wordmark'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-night-900 px-4 py-10">
      <div className="mb-8">
        <Wordmark href="/" size="lg" tagline />
      </div>
      <div className="w-full max-w-md rounded-xl border border-night-100 bg-white p-8 shadow-sm">
        {children}
      </div>
    </div>
  )
}
