import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRow } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  if (!userRow) return NextResponse.json({ error: 'No org found' }, { status: 404 })

  const orgId = userRow.org_id

  // Seed job postings
  const jobs = [
    {
      org_id: orgId,
      title_en: 'Senior Software Engineer',
      title_ar: 'مهندس برمجيات أول',
      slug: `senior-software-engineer-${Date.now()}`,
      employment_type: 'full_time',
      city: 'Riyadh',
      min_experience_years: 5,

      salary_min: 25000,
      salary_max: 40000,
      salary_visible: true,
      status: 'published',
      published_at: new Date().toISOString(),
      summary_en: 'We are looking for a Senior Software Engineer to lead our backend team and build scalable microservices.',
      requirements_en: '5+ years experience with Node.js/TypeScript, Experience with PostgreSQL and Redis, Strong system design skills, Knowledge of cloud platforms (AWS/GCP)',
    },
    {
      org_id: orgId,
      title_en: 'Product Designer (UI/UX)',
      title_ar: 'مصمم منتجات',
      slug: `product-designer-${Date.now()}`,
      employment_type: 'full_time',
      city: 'Jeddah',
      min_experience_years: 3,

      salary_min: 18000,
      salary_max: 30000,
      salary_visible: true,
      status: 'published',
      published_at: new Date().toISOString(),
      summary_en: 'Join our design team to craft beautiful, user-centered experiences for our recruitment platform.',
      requirements_en: 'Proficiency in Figma, 3+ years designing SaaS products, Strong portfolio, Experience with design systems',
    },
    {
      org_id: orgId,
      title_en: 'Marketing Manager',
      title_ar: 'مدير تسويق',
      slug: `marketing-manager-${Date.now()}`,
      employment_type: 'full_time',
      city: 'Riyadh',
      min_experience_years: 4,

      salary_min: 20000,
      salary_max: 35000,
      salary_visible: false,
      status: 'published',
      published_at: new Date().toISOString(),
      summary_en: 'Lead our marketing strategy for the Saudi market, including digital campaigns and brand positioning.',
      requirements_en: 'Experience in B2B SaaS marketing, Arabic and English fluency, Performance marketing expertise, Team management experience',
    },
    {
      org_id: orgId,
      title_en: 'Data Analyst',
      title_ar: 'محلل بيانات',
      slug: `data-analyst-${Date.now()}`,
      employment_type: 'full_time',
      city: 'Dammam',
      min_experience_years: 2,

      salary_min: 15000,
      salary_max: 22000,
      salary_visible: true,
      status: 'published',
      published_at: new Date().toISOString(),
      summary_en: 'Analyze recruitment data to drive insights and improve our platform matching algorithms.',
      requirements_en: 'SQL proficiency, Python/R for analysis, Experience with dashboards (Tableau/Metabase), Statistical analysis skills',
    },
    {
      org_id: orgId,
      title_en: 'Customer Success Lead',
      title_ar: 'قائد نجاح العملاء',
      slug: `customer-success-lead-${Date.now()}`,
      employment_type: 'full_time',
      city: 'Riyadh',
      min_experience_years: 3,

      salary_min: 16000,
      salary_max: 25000,
      salary_visible: true,
      status: 'draft',
      summary_en: 'Build and lead our customer success team, ensuring clients get maximum value from our platform.',
      requirements_en: 'Experience in SaaS customer success, Arabic fluency, CRM expertise, Team management skills',
    },
  ]

  const { data: insertedJobs, error: jobsError } = await supabaseAdmin
    .from('job_postings')
    .insert(jobs)
    .select('id, title_en')

  if (jobsError) return NextResponse.json({ error: 'Failed to seed jobs: ' + jobsError.message }, { status: 500 })

  // Create demo seeker profiles for applications
  const seekers = [
    { first_name_en: 'Ahmed', last_name_en: 'Al-Rashid', email: 'ahmed.rashid@demo.com', city: 'Riyadh', headline: 'Full Stack Developer | 6 years', current_title: 'Software Engineer', total_experience_years: 6, skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'] },
    { first_name_en: 'Sara', last_name_en: 'Al-Mahmoud', email: 'sara.mahmoud@demo.com', city: 'Jeddah', headline: 'UI/UX Designer | 4 years', current_title: 'Senior Designer', total_experience_years: 4, skills: ['Figma', 'UI Design', 'User Research', 'Prototyping'] },
    { first_name_en: 'Mohammed', last_name_en: 'Al-Otaibi', email: 'mohammed.otaibi@demo.com', city: 'Dammam', headline: 'Data Scientist | 3 years', current_title: 'Data Analyst', total_experience_years: 3, skills: ['Python', 'SQL', 'Machine Learning', 'Tableau'] },
    { first_name_en: 'Fatimah', last_name_en: 'Al-Harbi', email: 'fatimah.harbi@demo.com', city: 'Riyadh', headline: 'Marketing Specialist | 5 years', current_title: 'Digital Marketing Manager', total_experience_years: 5, skills: ['Digital Marketing', 'SEO', 'Content Strategy', 'Analytics'] },
    { first_name_en: 'Khalid', last_name_en: 'Al-Zahrani', email: 'khalid.zahrani@demo.com', city: 'Riyadh', headline: 'Backend Engineer | 8 years', current_title: 'Lead Engineer', total_experience_years: 8, skills: ['Go', 'Kubernetes', 'AWS', 'Microservices'] },
    { first_name_en: 'Noura', last_name_en: 'Al-Shammari', email: 'noura.shammari@demo.com', city: 'Jeddah', headline: 'Product Manager | 4 years', current_title: 'Product Manager', total_experience_years: 4, skills: ['Product Strategy', 'Agile', 'User Stories', 'Roadmapping'] },
    { first_name_en: 'Abdullah', last_name_en: 'Al-Ghamdi', email: 'abdullah.ghamdi@demo.com', city: 'Khobar', headline: 'DevOps Engineer | 5 years', current_title: 'DevOps Lead', total_experience_years: 5, skills: ['Docker', 'Terraform', 'CI/CD', 'Linux'] },
  ]

  const seekerProfiles = seekers.map(s => ({
    ...s,
    user_id: null,
    phone_country_code: '+966',
    nationality: 'Saudi',
    profile_completed: true,
    profile_completion_pct: 90,
    is_public: true,
  }))

  const { data: insertedSeekers, error: seekerError } = await supabaseAdmin
    .from('seeker_profiles')
    .insert(seekerProfiles)
    .select('id, first_name_en')

  if (seekerError) return NextResponse.json({ error: 'Failed to seed seekers: ' + seekerError.message }, { status: 500 })

  // Create applications (match seekers to jobs)
  const publishedJobs = insertedJobs!.filter((_, i) => i < 4)
  const statuses = ['submitted', 'under_review', 'shortlisted', 'interview', 'submitted', 'under_review', 'shortlisted']
  const applications = insertedSeekers!.map((seeker, i) => ({
    seeker_id: seeker.id,
    job_posting_id: publishedJobs[i % publishedJobs.length].id,
    org_id: orgId,
    status: statuses[i],
    submitted_at: new Date(Date.now() - (7 - i) * 86400000).toISOString(),
    form_responses: { cover_letter: `I am excited to apply for this position. With my ${seekers[i].total_experience_years} years of experience in ${seekers[i].skills[0]}, I believe I can make a strong contribution to your team.` },
  }))

  const { error: appError } = await supabaseAdmin
    .from('seeker_applications')
    .insert(applications)

  if (appError) return NextResponse.json({ error: 'Failed to seed applications: ' + appError.message }, { status: 500 })

  return NextResponse.json({
    success: true,
    seeded: {
      jobs: insertedJobs!.length,
      seekers: insertedSeekers!.length,
      applications: applications.length,
    }
  })
}
