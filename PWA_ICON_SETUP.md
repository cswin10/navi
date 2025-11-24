# PWA Icon Setup for Navi AI

Your app is now configured as a PWA (Progressive Web App) and can be installed on mobile home screens!

## Icons Needed

You need to create two PNG icons and place them in the `/public` folder:

1. **icon-192.png** - 192x192px
2. **icon-512.png** - 512x512px

## Quick Icon Generation

### Option 1: Use an Online Tool (Recommended)
1. Go to https://realfavicongenerator.net/ or https://www.pwabuilder.com/imageGenerator
2. Upload your logo/icon (square, at least 512x512px)
3. Generate the icons
4. Download and place `icon-192.png` and `icon-512.png` in `/public` folder

### Option 2: Create Simple Placeholder
Use this SVG as a starting point (blue circle with sparkles emoji):

```svg
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#3b82f6"/>
  <text x="256" y="340" font-size="280" text-anchor="middle" fill="white">✨</text>
</svg>
```

Save as SVG, then convert to PNG at:
- 192x192px for icon-192.png
- 512x512px for icon-512.png

### Option 3: Use Your Logo
If you have a Navi AI logo:
1. Make it square (1:1 aspect ratio)
2. Resize to 512x512px
3. Export as PNG
4. Name it `icon-512.png`
5. Resize a copy to 192x192px
6. Name it `icon-192.png`

## Testing the PWA

### On iOS (Safari):
1. Open https://navi-mocha-nine.vercel.app on Safari
2. Tap the Share button
3. Tap "Add to Home Screen"
4. Confirm
5. Navi will now appear on your home screen!

### On Android (Chrome):
1. Open https://navi-mocha-nine.vercel.app on Chrome
2. Look for the "Install app" banner at the bottom
3. Or tap the menu (⋮) → "Install app"
4. Confirm
5. Navi will now appear on your home screen!

## What's Included

✅ PWA Manifest (`/public/manifest.json`)
✅ Meta tags for mobile browsers
✅ Apple Web App configuration
✅ Standalone display mode (hides browser chrome)
✅ Theme color (blue) for status bar
✅ App shortcuts (Voice Assistant, Dashboard)
✅ Start URL set to /voice (opens directly to voice interface)

## Features

When installed as a PWA:
- **Fullscreen experience** - No browser chrome
- **Fast loading** - Cached for instant access
- **Home screen icon** - Just like a native app
- **Splash screen** - Shows while loading
- **App shortcuts** - Long-press icon for quick actions

## Notes

- The app will open directly to the `/voice` page when launched from home screen
- Users must be logged in, or they'll be redirected to login
- Works on both iOS and Android
- No app store approval needed!
