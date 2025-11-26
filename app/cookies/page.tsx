import { Navigation } from '@/components/landing/Navigation'
import { Footer } from '@/components/landing/Footer'
import Link from 'next/link'

export const metadata = {
  title: 'Cookie Policy | Navi AI',
  description: 'Cookie Policy for Navi AI - Voice-first personal assistant',
}

export default function CookiePolicyPage() {
  const lastUpdated = '26 November 2025'
  const contactEmail = 'privacy@navi-ai.com' // TODO: Update with real email

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <Navigation />

      <main className="container mx-auto px-4 pt-24 pb-12 max-w-4xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Cookie Policy</h1>
        <p className="text-slate-400 mb-8">Last updated: {lastUpdated}</p>

        <div className="prose prose-invert prose-slate max-w-none space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. What Are Cookies</h2>
            <p className="text-slate-300 leading-relaxed">
              Cookies are small text files that are stored on your device when you visit a website. They are widely used to make websites work more efficiently and provide information to site owners.
            </p>
            <p className="text-slate-300 leading-relaxed mt-4">
              Navi AI (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) uses cookies and similar technologies to provide, protect, and improve our voice-first AI personal assistant service.
            </p>
          </section>

          {/* How We Use Cookies */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. How We Use Cookies</h2>
            <p className="text-slate-300 leading-relaxed">
              We use cookies for the following purposes:
            </p>

            <h3 className="text-lg font-medium text-white mt-6 mb-3">2.1 Essential Cookies</h3>
            <p className="text-slate-300 leading-relaxed">
              These cookies are necessary for the website to function and cannot be switched off. They include:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 mt-2">
              <li><strong>Authentication Cookies:</strong> To keep you logged in and secure your session</li>
              <li><strong>Session Cookies:</strong> To maintain your state as you navigate the application</li>
              <li><strong>Security Cookies:</strong> To prevent cross-site request forgery (CSRF) attacks</li>
            </ul>

            <h3 className="text-lg font-medium text-white mt-6 mb-3">2.2 Functional Cookies</h3>
            <p className="text-slate-300 leading-relaxed">
              These cookies enable enhanced functionality and personalisation:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 mt-2">
              <li><strong>Preference Cookies:</strong> To remember your settings and preferences</li>
              <li><strong>Feature Cookies:</strong> To enable features like voice input permissions</li>
            </ul>

            <h3 className="text-lg font-medium text-white mt-6 mb-3">2.3 Analytics Cookies</h3>
            <p className="text-slate-300 leading-relaxed">
              We may use analytics cookies to understand how visitors interact with our website. These help us improve our service. Currently, we do not use third-party analytics services, but may in the future with proper consent.
            </p>
          </section>

          {/* Specific Cookies We Use */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. Specific Cookies We Use</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-slate-300 mt-4">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 font-medium text-white">Cookie Name</th>
                    <th className="text-left py-3 px-4 font-medium text-white">Purpose</th>
                    <th className="text-left py-3 px-4 font-medium text-white">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  <tr>
                    <td className="py-3 px-4 font-mono text-sm">sb-*-auth-token</td>
                    <td className="py-3 px-4">Supabase authentication</td>
                    <td className="py-3 px-4">Session / 1 year</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-mono text-sm">sb-*-auth-token-code-verifier</td>
                    <td className="py-3 px-4">OAuth security (PKCE)</td>
                    <td className="py-3 px-4">Session</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Third-Party Cookies */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Third-Party Cookies</h2>
            <p className="text-slate-300 leading-relaxed">
              When you connect third-party services (like Google Calendar or Gmail), those services may set their own cookies. These are governed by the respective third party&apos;s cookie and privacy policies:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 mt-4">
              <li><strong>Google:</strong> <a href="https://policies.google.com/technologies/cookies" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">Google Cookies Policy</a></li>
            </ul>
          </section>

          {/* Managing Cookies */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Managing Cookies</h2>
            <p className="text-slate-300 leading-relaxed">
              You can control and manage cookies in various ways:
            </p>

            <h3 className="text-lg font-medium text-white mt-6 mb-3">5.1 Browser Settings</h3>
            <p className="text-slate-300 leading-relaxed">
              Most browsers allow you to refuse or accept cookies, and delete existing cookies. The methods vary between browsers:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 mt-2">
              <li><a href="https://support.google.com/chrome/answer/95647" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">Google Chrome</a></li>
              <li><a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a></li>
              <li><a href="https://support.apple.com/en-gb/guide/safari/sfri11471/mac" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">Safari</a></li>
              <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">Microsoft Edge</a></li>
            </ul>

            <h3 className="text-lg font-medium text-white mt-6 mb-3">5.2 Impact of Disabling Cookies</h3>
            <p className="text-slate-300 leading-relaxed">
              Please note that disabling essential cookies will prevent you from using Navi&apos;s core functionality, including:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 mt-2">
              <li>Staying logged in to your account</li>
              <li>Accessing your saved preferences and data</li>
              <li>Using voice commands and AI features</li>
            </ul>
          </section>

          {/* Local Storage */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. Local Storage</h2>
            <p className="text-slate-300 leading-relaxed">
              In addition to cookies, we may use local storage to store certain preferences and cache data for performance. Local storage functions similarly to cookies but can store larger amounts of data. You can clear local storage through your browser&apos;s developer tools or settings.
            </p>
          </section>

          {/* Updates to This Policy */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">7. Updates to This Policy</h2>
            <p className="text-slate-300 leading-relaxed">
              We may update this Cookie Policy from time to time to reflect changes in technology, legislation, or our data practices. We will notify you of significant changes by updating the &quot;Last updated&quot; date at the top of this policy.
            </p>
          </section>

          {/* Contact Us */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">8. Contact Us</h2>
            <p className="text-slate-300 leading-relaxed">
              If you have questions about our use of cookies or this Cookie Policy, please contact us at:
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
