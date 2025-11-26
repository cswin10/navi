import { Navigation } from '@/components/landing/Navigation'
import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service | Navi AI',
  description: 'Terms of Service for Navi AI - Voice-first personal assistant',
}

export default function TermsPage() {
  const lastUpdated = '26 November 2025'
  const contactEmail = 'legal@navi-ai.com' // TODO: Update with real email

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <Navigation />

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-slate-400 mb-8">Last updated: {lastUpdated}</p>

        <div className="prose prose-invert prose-slate max-w-none space-y-8">
          {/* Agreement */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Agreement to Terms</h2>
            <p className="text-slate-300 leading-relaxed">
              By accessing or using Navi AI (&quot;Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you disagree with any part of these terms, you may not access the Service.
            </p>
          </section>

          {/* Description of Service */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Description of Service</h2>
            <p className="text-slate-300 leading-relaxed">
              Navi AI is a voice-first AI personal assistant that helps you manage tasks, calendar events, emails, notes, and other personal information through voice commands and text input. The Service integrates with third-party services including Google Calendar and Gmail.
            </p>
          </section>

          {/* User Accounts */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. User Accounts</h2>
            <p className="text-slate-300 leading-relaxed">
              To use certain features, you must create an account. You agree to:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 mt-2">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorised access</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>
            <p className="text-slate-300 leading-relaxed mt-4">
              You must be at least 16 years old to use this Service.
            </p>
          </section>

          {/* Acceptable Use */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Acceptable Use</h2>
            <p className="text-slate-300 leading-relaxed">You agree NOT to:</p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 mt-2">
              <li>Use the Service for any illegal purpose</li>
              <li>Send spam, phishing, or malicious emails through our Service</li>
              <li>Attempt to gain unauthorised access to our systems</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Reverse engineer or decompile any part of the Service</li>
              <li>Use the Service to harass, abuse, or harm others</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Impersonate any person or entity</li>
            </ul>
          </section>

          {/* Third-Party Integrations */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Third-Party Integrations</h2>
            <p className="text-slate-300 leading-relaxed">
              The Service integrates with third-party services (Google, OpenAI, Anthropic, ElevenLabs). Your use of these integrations is subject to their respective terms of service and privacy policies.
            </p>
            <p className="text-slate-300 leading-relaxed mt-4">
              We are not responsible for the availability, accuracy, or content of third-party services. You grant us permission to access and use your connected accounts solely for the purpose of providing the Service.
            </p>
          </section>

          {/* Emails Sent on Your Behalf */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. Emails Sent on Your Behalf</h2>
            <p className="text-slate-300 leading-relaxed">
              When you use Navi to send emails through your connected Gmail account:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 mt-2">
              <li>Emails are sent from YOUR Gmail account, not from Navi</li>
              <li>You are solely responsible for the content and recipients of emails</li>
              <li>You must comply with all applicable email laws (CAN-SPAM, GDPR, etc.)</li>
              <li>We recommend reviewing AI-drafted emails before sending</li>
            </ul>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">7. Intellectual Property</h2>
            <p className="text-slate-300 leading-relaxed">
              The Service and its original content, features, and functionality are owned by Navi AI and are protected by international copyright, trademark, and other intellectual property laws.
            </p>
            <p className="text-slate-300 leading-relaxed mt-4">
              You retain ownership of any content you create through the Service (tasks, notes, etc.).
            </p>
          </section>

          {/* Disclaimer of Warranties */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">8. Disclaimer of Warranties</h2>
            <p className="text-slate-300 leading-relaxed">
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 mt-2">
              <li>Merchantability or fitness for a particular purpose</li>
              <li>Non-infringement</li>
              <li>Accuracy or completeness of AI-generated content</li>
              <li>Uninterrupted or error-free operation</li>
            </ul>
            <p className="text-slate-300 leading-relaxed mt-4">
              AI-generated content may contain errors. Always review important communications before sending.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">9. Limitation of Liability</h2>
            <p className="text-slate-300 leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, NAVI AI SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 mt-2">
              <li>Loss of profits, data, or business opportunities</li>
              <li>Damages arising from emails sent through the Service</li>
              <li>Damages from third-party service outages</li>
              <li>Damages from AI errors or inaccuracies</li>
            </ul>
            <p className="text-slate-300 leading-relaxed mt-4">
              Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.
            </p>
          </section>

          {/* Indemnification */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">10. Indemnification</h2>
            <p className="text-slate-300 leading-relaxed">
              You agree to indemnify and hold harmless Navi AI and its officers, directors, employees, and agents from any claims, damages, losses, or expenses (including legal fees) arising from:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 mt-2">
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any third-party rights</li>
              <li>Content of emails sent through the Service</li>
            </ul>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">11. Termination</h2>
            <p className="text-slate-300 leading-relaxed">
              We may terminate or suspend your account immediately, without prior notice, for any reason, including breach of these Terms. Upon termination:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 mt-2">
              <li>Your right to use the Service ceases immediately</li>
              <li>We may delete your data (subject to our data retention policy)</li>
              <li>Provisions that should survive termination will remain in effect</li>
            </ul>
            <p className="text-slate-300 leading-relaxed mt-4">
              You may delete your account at any time through the settings page.
            </p>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">12. Governing Law</h2>
            <p className="text-slate-300 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of England and Wales, without regard to its conflict of law provisions.
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">13. Changes to Terms</h2>
            <p className="text-slate-300 leading-relaxed">
              We reserve the right to modify these Terms at any time. We will notify you of significant changes by posting the new Terms on this page and updating the &quot;Last updated&quot; date. Continued use of the Service after changes constitutes acceptance of the modified Terms.
            </p>
          </section>

          {/* Severability */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">14. Severability</h2>
            <p className="text-slate-300 leading-relaxed">
              If any provision of these Terms is held to be unenforceable, the remaining provisions will continue in full force and effect.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">15. Contact Us</h2>
            <p className="text-slate-300 leading-relaxed">
              If you have questions about these Terms, contact us at:
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

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 sm:py-8">
        <div className="container mx-auto px-4 text-center text-slate-400 text-xs sm:text-sm">
          <p>© 2025 Navi AI. All rights reserved.</p>
          <div className="mt-2 space-x-4">
            <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
