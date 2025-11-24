'use client'

import { useEffect, useState } from 'react'
import { X, Download, Share } from 'lucide-react'
import { Button } from './Button'

export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if already installed
    const isInStandaloneMode = () => {
      return (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes('android-app://')
      )
    }

    setIsStandalone(isInStandaloneMode())

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(iOS)

    // Listen for beforeinstallprompt event (Android Chrome)
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Show prompt for iOS after a delay
    if (iOS && !isInStandaloneMode()) {
      setTimeout(() => {
        const hasSeenPrompt = localStorage.getItem('hasSeenInstallPrompt')
        if (!hasSeenPrompt) {
          setShowPrompt(true)
        }
      }, 2000)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Android Chrome
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setDeferredPrompt(null)
        setShowPrompt(false)
      }
    }
  }

  const handleClose = () => {
    setShowPrompt(false)
    localStorage.setItem('hasSeenInstallPrompt', 'true')
  }

  if (!showPrompt || isStandalone) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom duration-300">
      <div className="max-w-md mx-auto bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 shadow-2xl">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center text-3xl">
              ✨
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Install Navi AI</h3>
              <p className="text-xs text-white/80">Quick access from your home screen</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-white/70 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {isIOS ? (
          // iOS instructions
          <div className="space-y-3 text-sm text-white bg-white/10 backdrop-blur rounded-lg p-4">
            <p className="font-semibold flex items-center gap-2">
              <span className="text-lg">📱</span>
              Tap <Share className="w-4 h-4 inline mx-1" /> Share, then "Add to Home Screen"
            </p>
          </div>
        ) : deferredPrompt ? (
          // Android with install prompt
          <Button
            onClick={handleInstallClick}
            className="w-full bg-white text-blue-600 hover:bg-white/90 font-semibold text-lg py-6"
          >
            <Download className="w-5 h-5 mr-2" />
            Install Now
          </Button>
        ) : (
          // Android without install prompt
          <div className="space-y-3 text-sm text-white bg-white/10 backdrop-blur rounded-lg p-4">
            <p className="font-semibold flex items-center gap-2">
              <span className="text-lg">📱</span>
              Tap menu (⋮), then "Install app"
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
