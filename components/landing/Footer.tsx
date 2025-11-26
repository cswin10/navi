import Link from 'next/link'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-slate-800 py-8 sm:py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Logo and Copyright */}
          <div className="text-center sm:text-left">
            <Link href="/" className="text-xl font-bold text-white mb-2 block">
              Navi<span className="text-blue-400">.</span>
            </Link>
            <p className="text-slate-400 text-xs sm:text-sm">
              © {currentYear} Navi AI. All rights reserved.
            </p>
          </div>

          {/* Legal Links */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm">
            <Link
              href="/privacy"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="/cookies"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Cookie Policy
            </Link>
          </div>

          {/* Powered By */}
          <div className="text-center sm:text-right">
            <p className="text-slate-500 text-xs">
              Powered by OpenAI, Anthropic & ElevenLabs
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
