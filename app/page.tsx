import { Navigation } from '@/components/landing/Navigation'
import { Hero } from '@/components/landing/Hero'
import { Features } from '@/components/landing/Features'
import { CTA } from '@/components/landing/CTA'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <Navigation />
      <Hero />
      <Features />
      <CTA />

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <div className="container mx-auto px-4 text-center text-slate-400 text-sm">
          <p>© 2025 NaviOS. Powered by OpenAI, Anthropic, and ElevenLabs.</p>
        </div>
      </footer>
    </div>
  )
}
