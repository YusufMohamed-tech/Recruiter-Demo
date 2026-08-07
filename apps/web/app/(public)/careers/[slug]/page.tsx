import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, Briefcase, Calendar, Clock, ArrowLeft, DollarSign, GraduationCap } from 'lucide-react'
import { createServerSupabase } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'

type Props = { params: Promise<{ slug: string }> }

const EMP_LABEL: Record<string, string> = {
  full_time: 'Full-time', part_time: 'Part-time', contract: 'Contract', internship: 'Internship',
}

async function getJob(slug: string) {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('job_postings')
    .select(`
      id, slug, title_en, title_ar,
      summary_en, summary_ar,
      description_en, description_ar,
      requirements_en, requirements_ar,
      city, employment_type, deadline, published_at,
      salary_visible, salary_min, salary_max,
      nationality_req, min_experience_years, education_level,
      seo_title, seo_description,
      department:departments(id, name_en, name_ar),
      establishment:establishments(id, name_en, name_ar)
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error) return null
  return data
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const job = await getJob((await params).slug)
  if (!job) return { title: 'Job Not Found' }
  return {
    title:       job.seo_title       ?? `${job.title_en} | Chessboard Group Careers`,
    description: job.seo_description ?? job.summary_en ?? `Apply for ${job.title_en} at Chessboard Group.`,
    openGraph: {
      title:       job.seo_title ?? job.title_en,
      description: job.seo_description ?? job.summary_en ?? '',
      type: 'website',
    },
  }
}

export default async function JobDetailPage({ params }: Props) {
  const job = await getJob((await params).slug)
  if (!job) notFound()

  const isDeadlineSoon = job.deadline
    ? (new Date(job.deadline).getTime() - Date.now()) < 7 * 86400000
    : false

  // Structured data (JSON-LD)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title_en,
    description: job.description_en ?? job.summary_en ?? '',
    datePosted: job.published_at,
    validThrough: job.deadline ?? undefined,
    hiringOrganization: { '@type': 'Organization', name: 'Chessboard Group' },
    jobLocation: job.city ? {
      '@type': 'Place',
      address: { '@type': 'PostalAddress', addressLocality: job.city, addressCountry: 'SA' },
    } : undefined,
    employmentType: job.employment_type?.toUpperCase().replace(/_/g, '_'),
    ...(job.salary_visible && job.salary_min ? {
      baseSalary: {
        '@type': 'MonetaryAmount',
        currency: 'SAR',
        value: { '@type': 'QuantitativeValue', minValue: job.salary_min, maxValue: job.salary_max, unitText: 'MONTH' },
      },
    } : {}),
  }

  const formatContent = (text?: string) =>
    text?.split('\n').filter(Boolean).map((line, i) => <p key={i} className="mb-2">{line}</p>)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="mx-auto max-w-content px-4 py-8 sm:px-6">
        <Link href="/careers" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to careers
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Main content */}
          <div>
            <div className="rounded-xl border bg-card p-7">
              <h1 className="font-heading text-3xl font-bold">{job.title_en}</h1>
              {job.title_ar && (
                <p className="mt-1 text-lg text-muted-foreground font-arabic" dir="rtl">{job.title_ar}</p>
              )}

              {job.summary_en && (
                <p className="mt-4 text-muted-foreground leading-relaxed">{job.summary_en}</p>
              )}

              {/* Meta chips */}
              <div className="mt-5 flex flex-wrap gap-3">
                {job.department && (
                  <Chip icon={Briefcase} text={job.department.name_en} />
                )}
                {job.city && <Chip icon={MapPin} text={job.city} />}
                <Chip icon={Clock} text={EMP_LABEL[job.employment_type] ?? job.employment_type} />
                {job.min_experience_years != null && (
                  <Chip icon={Briefcase} text={`${job.min_experience_years}+ yrs exp`} />
                )}
                {job.education_level && (
                  <Chip icon={GraduationCap} text={job.education_level.replace(/_/g, ' ')} />
                )}
                {job.salary_visible && job.salary_min && (
                  <Chip icon={DollarSign}
                    text={`${job.salary_min.toLocaleString()}–${job.salary_max?.toLocaleString() ?? '?'} SAR/mo`} />
                )}
              </div>

              {/* Description */}
              {job.description_en && (
                <section className="mt-8">
                  <h2 className="font-heading text-xl font-semibold mb-3">About the Role</h2>
                  <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed">
                    {formatContent(job.description_en)}
                  </div>
                </section>
              )}

              {/* Requirements */}
              {job.requirements_en && (
                <section className="mt-8">
                  <h2 className="font-heading text-xl font-semibold mb-3">Requirements</h2>
                  <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed">
                    {formatContent(job.requirements_en)}
                  </div>
                </section>
              )}

              {/* Arabic content */}
              {(job.description_ar || job.requirements_ar) && (
                <div className="mt-8 border-t pt-8" dir="rtl">
                  {job.description_ar && (
                    <section className="mb-6">
                      <h2 className="font-heading text-xl font-semibold mb-3 font-arabic">عن الوظيفة</h2>
                      <div className="text-sm text-muted-foreground leading-relaxed font-arabic">
                        {formatContent(job.description_ar)}
                      </div>
                    </section>
                  )}
                  {job.requirements_ar && (
                    <section>
                      <h2 className="font-heading text-xl font-semibold mb-3 font-arabic">المتطلبات</h2>
                      <div className="text-sm text-muted-foreground leading-relaxed font-arabic">
                        {formatContent(job.requirements_ar)}
                      </div>
                    </section>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sticky sidebar */}
          <div className="space-y-4">
            <div className="sticky top-20 rounded-xl border bg-card p-6 space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Apply Now</p>
                <p className="mt-1 text-sm text-muted-foreground">Start your application in minutes.</p>
              </div>

              {job.deadline && (
                <div className={`rounded-lg px-3 py-2 text-sm ${isDeadlineSoon ? 'bg-status-warning/10 text-status-warning' : 'bg-muted text-muted-foreground'}`}>
                  <p className="font-medium">Application deadline</p>
                  <p className="mt-0.5">{new Date(job.deadline).toLocaleDateString('en-SA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              )}

              <Button asChild className="w-full" size="lg">
                <Link href={`/careers/${job.slug}/apply`}>Apply for this position</Link>
              </Button>

              <Button asChild variant="outline" className="w-full" size="sm">
                <Link href="/careers">View all positions</Link>
              </Button>

              {/* Quick facts */}
              <div className="space-y-2 border-t pt-4 text-sm">
                {job.establishment && <Fact label="Location" value={job.establishment.name_en} />}
                {job.nationality_req && <Fact label="Nationality" value={job.nationality_req === 'saudi' ? 'Saudi nationals only' : 'Open to all'} />}
                <Fact label="Posted" value={new Date(job.published_at).toLocaleDateString()} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function Chip({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground capitalize">
      <Icon className="h-3.5 w-3.5 shrink-0" />{text}
    </span>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-end">{value}</span>
    </div>
  )
}
