import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createServerSupabase } from '@/lib/supabase/server'
import { ApplicationForm } from './ApplicationForm'

type Props = { params: Promise<{ slug: string }> }

async function getJob(slug: string) {
  const supabase = await createServerSupabase()
  const { data } = await supabase
    .from('job_postings')
    .select('id, slug, title_en, title_ar, department:departments(name_en), city')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()
  return data
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const job = await getJob((await params).slug)
  if (!job) return { title: 'Apply | Chessboard Group' }
  return { title: `Apply — ${job.title_en} | Chessboard Group` }
}

export default async function ApplyPage({ params }: Props) {
  const job = await getJob((await params).slug)
  if (!job) notFound()
  return <ApplicationForm job={job as any} />
}
