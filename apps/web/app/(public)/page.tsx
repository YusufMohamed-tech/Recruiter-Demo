import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Search, Building2, Users, Zap } from 'lucide-react'

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-dark to-gray-900 text-white py-20 md:py-32">
        <div className="max-w-content mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-heading font-bold mb-6">
            Find Your Next Opportunity<br />
            <span className="text-brand-primary">in Saudi Arabia</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Connect with top companies across the Kingdom. Build your professional profile
            and apply with one click.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-brand-primary text-brand-dark hover:bg-brand-primary/90 font-semibold">
              <Link href="/signup">Get Started Free</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              <Link href="/jobs">Browse Jobs</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-content mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-heading font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={Users}
              title="Create Your Profile"
              description="Sign up with Google in seconds. Build a professional profile with your experience, skills, and preferences."
            />
            <FeatureCard
              icon={Search}
              title="Discover Opportunities"
              description="Search jobs across top Saudi companies. Filter by city, industry, salary, and more."
            />
            <FeatureCard
              icon={Zap}
              title="Apply in One Click"
              description="Your profile is your application. Just answer the company's questions and submit."
            />
          </div>
        </div>
      </section>

      {/* For Companies */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-content mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-heading font-bold mb-4">For Companies</h2>
              <p className="text-lg text-muted-foreground mb-6">
                Post jobs, receive applications from qualified candidates, and manage your
                hiring pipeline — all in one platform.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm">
                  <span className="h-5 w-5 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary text-xs">✓</span>
                  Post jobs in minutes with custom screening questions
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <span className="h-5 w-5 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary text-xs">✓</span>
                  AI-powered candidate matching and scoring
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <span className="h-5 w-5 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary text-xs">✓</span>
                  Visual pipeline management (Kanban board)
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <span className="h-5 w-5 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary text-xs">✓</span>
                  Saudi compliance built-in (Nitaqat, Saudization)
                </li>
              </ul>
              <Button asChild>
                <Link href="/signup/company">Register Your Company</Link>
              </Button>
            </div>
            <div className="bg-white border rounded-xl p-8 shadow-sm">
              <Building2 className="h-16 w-16 text-brand-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Trusted by Leading Companies</h3>
              <p className="text-muted-foreground text-sm">
                Companies across technology, healthcare, construction, and finance
                use Chessboard to find top talent in the Kingdom.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 bg-brand-dark text-white text-center">
        <div className="max-w-content mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-heading font-bold mb-4">Ready to Start?</h2>
          <p className="text-gray-300 mb-8 max-w-xl mx-auto">
            Join thousands of job seekers and companies already using Chessboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-brand-primary text-brand-dark hover:bg-brand-primary/90 font-semibold">
              <Link href="/signup">Sign Up as Job Seeker</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              <Link href="/signup/company">Register as Company</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="text-center p-6">
      <div className="h-12 w-12 rounded-full bg-brand-primary/10 flex items-center justify-center mx-auto mb-4">
        <Icon className="h-6 w-6 text-brand-primary" />
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  )
}
