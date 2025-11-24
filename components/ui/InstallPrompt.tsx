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
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-slate-900 to-transparent">
      <div className="max-w-md mx-auto bg-slate-800 border border-blue-500/50 rounded-lg p-4 shadow-xl">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-2xl">
              ✨
            </div>
            <div>
              <h3 className="text-white font-semibold">Install Navi</h3>
              <p className="text-xs text-slate-400">Add to home screen for quick access</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isIOS ? (
          // iOS instructions
          <div className="space-y-2 text-sm text-slate-300">
            <p className="text-white font-medium">How to install on iPhone:</p>
            <ol className="space-y-1 ml-4 list-decimal">
              <li>Tap the <Share className="w-4 h-4 inline" /> <strong>Share</strong> button below</li>
              <li>Scroll down and tap <strong>Add to Home Screen</strong></li>
              <li>Tap <strong>Add</strong></li>
            </ol>
          </div>
        ) : deferredPrompt ? (
          // Android with install prompt
          <Button
            onClick={handleInstallClick}
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            Install App
          </Button>
        ) : (
          // Android without install prompt
          <div className="space-y-2 text-sm text-slate-300">
            <p className="text-white font-medium">How to install on Android:</p>
            <ol className="space-y-1 ml-4 list-decimal">
              <li>Tap the menu (⋮) in your browser</li>
              <li>Tap <strong>Install app</strong> or <strong>Add to Home screen</strong></li>
              <li>Tap <strong>Install</strong></li>
            </ol>
          </div>
        )}
      </div>
    </div>
  )
}
