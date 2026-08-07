import { ReadinessDetail } from './ReadinessDetail'

export const metadata = { title: 'Readiness Case' }

export default async function ReadinessCasePage({ params }: { params: Promise<{ id: string }> }) {
  return <ReadinessDetail id={(await params).id} />
}
