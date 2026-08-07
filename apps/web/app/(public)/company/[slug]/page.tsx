'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Globe, Users, Building2, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export default function CompanyPublicPage() {
  const { slug } = useParams() as { slug: string }
  const supabase = createClient()
  const [company, setCompany] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: profile } = await supabase
        .from('company_profiles')
        .select('*, organizations(id, legal_name_en, legal_name_ar, headquarters_city, website)')
        .eq('slug', slug)
        .single()

      if (!profile) {
        const { data: org } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', slug)
          .single()
        if (org) {
          setCompany({ display_name_en: org.legal_name_en, headquarters: org.headquarters_city, website: org.website, organizations: org })
          const { data: orgJobs } = await supabase
            .from('job_postings')
            .select('id, title_en, slug, city, employment_type, created_at')
            .eq('org_id', org.id)
            .eq('status', 'published')
            .order('created_at', { ascending: false })
          setJobs(orgJobs || [])
        }
      } else {
        setCompany(profile)
        const orgId = profile.org_id
        const { data: orgJobs } = await supabase
          .from('job_postings')
          .select('id, title_en, slug, city, employment_type, created_at')
          .eq('org_id', orgId)
          .eq('status', 'published')
          .order('created_at', { ascending: false })
        setJobs(orgJobs || [])
      }
      setLoading(false)
    }
    load()
  }, [slug])

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-8"><div className="h-96 bg-gray-200 rounded-lg animate-pulse" /></div>
  if (!company) return <div className="max-w-4xl mx-auto px-4 py-8 text-center"><p>Company not found</p></div>

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center text-xl font-bold text-gray-500">
            {company.display_name_en?.charAt(0) || company.organizations?.legal_name_en?.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{company.display_name_en || company.organizations?.legal_name_en}</h1>
              {company.is_verified && <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">Verified</span>}
            </div>
            {company.tagline_en && <p className="text-muted-foreground mt-1">{company.tagline_en}</p>}
            <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground">
              {company.headquarters && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{company.headquarters}</span>}
              {company.industry && <span className="flex items-center gap-1"><Building2 className="h-4 w-4" />{company.industry}</span>}
              {company.company_size && <span className="flex items-center gap-1"><Users className="h-4 w-4" />{company.company_size} employees</span>}
              {company.website && (
                <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                  <Globe className="h-4 w-4" />Website
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* About */}
      {company.description_en && (
        <div className="bg-white border rounded-lg p-6">
          <h2 className="font-semibold text-lg mb-3">About</h2>
          <p className="text-muted-foreground whitespace-pre-wrap">{company.description_en}</p>
        </div>
      )}

      {/* Benefits */}
      {company.benefits?.length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <h2 className="font-semibold text-lg mb-3">Benefits</h2>
          <div className="flex flex-wrap gap-2">
            {company.benefits.map((b: string) => (
              <span key={b} className="bg-green-50 text-green-700 text-sm px-3 py-1 rounded-full">{b}</span>
            ))}
          </div>
        </div>
      )}

      {/* Open Positions */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="font-semibold text-lg mb-4">
          Open Positions ({jobs.length})
        </h2>
        {jobs.length === 0 ? (
          <p className="text-muted-foreground text-sm">No open positions right now</p>
        ) : (
          <div className="space-y-3">
            {jobs.map(job => (
              <Link key={job.id} href={`/jobs/${job.slug}`} className="flex items-center justify-between p-3 rounded-md hover:bg-gray-50 border">
                <div>
                  <p className="font-medium">{job.title_en}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    {job.city && <span>{job.city}</span>}
                    <span className="capitalize">{job.employment_type?.replace('_', ' ')}</span>
                  </div>
                </div>
                <Button size="sm" variant="outline">View</Button>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
