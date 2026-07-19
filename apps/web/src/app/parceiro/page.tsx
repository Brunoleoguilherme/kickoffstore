import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function PartnerIndexPage() {
  redirect('/parceiro/painel')
}
