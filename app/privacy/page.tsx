import { Navigation } from '@/components/landing/Navigation'
import { Footer } from '@/components/landing/Footer'
import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy | Navi AI',
  description: 'Privacy Policy for Navi AI - Voice-first personal assistant',
}

export default function PrivacyPage() {
  const lastUpdated = '26 November 2025'
  const contactEmail = 'privacy@navi-ai.com' // TODO: Update with real email

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <Navigation />

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-slate-400 mb-8">Last updated: {lastUpdated}</p>

        <div className="prose prose-invert prose-slate max-w-none space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Introduction</h2>
            <p className="text-slate-300 leading-relaxed">
              Navi AI (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our voice-first AI personal assistant service.
            </p>
            <p className="text-slate-300 leading-relaxed mt-4">
              By using Navi, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies, please do not use our service.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Information We Collect</h2>

            <h3 className="text-lg font-medium text-white mt-6 mb-3">2.1 Information You Provide</h3>
            <ul className="list-disc list-inside text-slate-300 space-y-2">
              <li><strong>Account Information:</strong> Email address, name, and authentication credentials</li>
              <li><strong>Profile Data:</strong> Personal preferences, email signature, and knowledge base entries you choose to store</li>
              <li><strong>Voice Commands:</strong> Audio recordings that are transcribed to text for processing</li>
              <li><strong>Content You Create:</strong> Tasks, notes, calendar events, and emails you create through Navi</li>
            </ul>

            <h3 className="text-lg font-medium text-white mt-6 mb-3">2.2 Information from Third-Party Services</h3>
            <p className="text-slate-300 leading-relaxed">
              When you connect third-party services (Google Calendar, Gmail), we access:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 mt-2">
              <li><strong>Google Calendar:</strong> Calendar events, to display and create events on your behalf</li>
              <li><strong>Gmail:</strong> Ability to send emails on your behalf (we do not read your inbox)</li>
            </ul>

            <h3 className="text-lg font-medium text-white mt-6 mb-3">2.3 Automatically Collected Information</h3>
            <ul className="list-disc list-inside text-slate-300 space-y-2">
              <li>Device information and browser type</li>
              <li>Usage patterns and feature interactions</li>
              <li>Error logs and performance data</li>
            </ul>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
            <p className="text-slate-300 leading-relaxed">We use your information to:</p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 mt-2">
              <li>Provide and maintain our service</li>
              <li>Process your voice commands and execute requested actions</li>
              <li>Personalise your experience based on your preferences</li>
              <li>Send emails and manage calendar events on your behalf</li>
              <li>Improve our service and develop new features</li>
              <li>Communicate with you about updates or issues</li>
              <li>Ensure security and prevent fraud</li>
            </ul>
          </section>

          {/* Third-Party Services */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Third-Party Services</h2>
            <p className="text-slate-300 leading-relaxed">
              Navi uses the following third-party services to provide functionality:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 mt-4">
              <li><strong>OpenAI (Whisper):</strong> Voice transcription - audio is sent to OpenAI for speech-to-text conversion</li>
              <li><strong>Anthropic (Claude):</strong> Intent processing - your text commands are processed to understand actions</li>
              <li><strong>ElevenLabs:</strong> Text-to-speech - responses are converted to voice</li>
              <li><strong>Google APIs:</strong> Calendar and Gmail integration (with your explicit consent)</li>
              <li><strong>Supabase:</strong> Database hosting and authentication</li>
            </ul>
            <p className="text-slate-300 leading-relaxed mt-4">
              Each third-party service has its own privacy policy. We encourage you to review their policies.
            </p>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Data Retention</h2>
            <ul className="list-disc list-inside text-slate-300 space-y-2">
              <li><strong>Voice Recordings:</strong> Audio is processed in real-time and not stored permanently. Transcripts may be retained for up to 30 days for service improvement.</li>
              <li><strong>Account Data:</strong> Retained while your account is active</li>
              <li><strong>Action History:</strong> Retained for your reference, deletable at any time</li>
              <li><strong>Upon Deletion:</strong> All your data is permanently deleted within 30 days of account deletion</li>
            </ul>
          </section>

          {/* Your Rights (GDPR) */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. Your Rights</h2>
            <p className="text-slate-300 leading-relaxed">
              Under GDPR and other applicable laws, you have the right to:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 mt-2">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
              <li><strong>Erasure:</strong> Request deletion of your data (&quot;right to be forgotten&quot;)</li>
              <li><strong>Portability:</strong> Export your data in a machine-readable format</li>
              <li><strong>Objection:</strong> Object to processing of your data</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent at any time</li>
            </ul>
            <p className="text-slate-300 leading-relaxed mt-4">
              To exercise these rights, visit your account settings or contact us at {contactEmail}.
            </p>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">7. Data Security</h2>
            <p className="text-slate-300 leading-relaxed">
              We implement appropriate security measures including:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 mt-2">
              <li>Encryption in transit (HTTPS/TLS)</li>
              <li>Secure OAuth authentication (we never store your Google password)</li>
              <li>Row-level security in our database</li>
              <li>Regular security audits and updates</li>
            </ul>
            <p className="text-slate-300 leading-relaxed mt-4">
              While we strive to protect your data, no method of transmission over the internet is 100% secure.
            </p>
          </section>

          {/* International Transfers */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">8. International Data Transfers</h2>
            <p className="text-slate-300 leading-relaxed">
              Your data may be transferred to and processed in countries outside your residence, including the United States (where our third-party providers operate). We ensure appropriate safeguards are in place for such transfers.
            </p>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">9. Children&apos;s Privacy</h2>
            <p className="text-slate-300 leading-relaxed">
              Navi is not intended for children under 16. We do not knowingly collect personal information from children. If you believe we have collected data from a child, please contact us immediately.
            </p>
          </section>

          {/* Changes to This Policy */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">10. Changes to This Policy</h2>
            <p className="text-slate-300 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the &quot;Last updated&quot; date. Continued use of Navi after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* Contact Us */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">11. Contact Us</h2>
            <p className="text-slate-300 leading-relaxed">
              If you have questions about this Privacy Policy or our data practices, contact us at:
            </p>
            <p className="text-slate-300 mt-4">
              Email: <a href={`mailto:${contactEmail}`} className="text-blue-400 hover:underline">{contactEmail}</a>
            </p>
          </section>
        </div>

        {/* Back Link */}
        <div className="mt-12 pt-8 border-t border-slate-800">
          <Link href="/" className="text-blue-400 hover:underline">
            &larr; Back to Home
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
