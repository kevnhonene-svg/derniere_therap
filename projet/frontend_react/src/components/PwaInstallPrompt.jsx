import { useEffect, useState } from 'react'
import { Download, Share, X } from 'lucide-react'

const canShowIosHelp = () => {
  if (typeof window === 'undefined') return false
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone
  const installed = localStorage.getItem('pwa-installed') === 'oui'
  const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent)
  const isSafari = /^((?!chrome|android|crios|fxios|edgios).)*safari/i.test(window.navigator.userAgent)
  return isIos && isSafari && !isStandalone && !installed
}

const shouldShowReminder = () => {
  if (localStorage.getItem('pwa-installed') === 'oui') return false
  const lastClosed = Number(localStorage.getItem('pwa-install-closed-at') || 0)
  return Date.now() - lastClosed > 1000 * 60
}

const isAndroidBrowser = () => {
  if (typeof window === 'undefined') return false
  return /android/i.test(window.navigator.userAgent)
}

function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] = useState(null)
  const [iosHelp] = useState(() => canShowIosHelp())
  const [visible, setVisible] = useState(() => canShowIosHelp() && shouldShowReminder())
  const [manualHelp, setManualHelp] = useState(false)

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone
    if (isStandalone || localStorage.getItem('pwa-installed') === 'oui') return undefined

    const beforeInstall = (event) => {
      event.preventDefault()
      setInstallEvent(event)
      setManualHelp(false)
      setVisible(shouldShowReminder())
    }

    const installed = () => {
      setVisible(false)
      setInstallEvent(null)
      localStorage.setItem('pwa-installed', 'oui')
    }

    window.addEventListener('beforeinstallprompt', beforeInstall)
    window.addEventListener('appinstalled', installed)

    const manualTimer = window.setTimeout(() => {
      if (isAndroidBrowser() && !canShowIosHelp() && shouldShowReminder()) {
        setManualHelp(true)
        setVisible(true)
      }
    }, 3000)

    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstall)
      window.removeEventListener('appinstalled', installed)
      window.clearTimeout(manualTimer)
    }
  }, [])

  useEffect(() => {
    if (visible || (!installEvent && !iosHelp && !manualHelp)) return undefined

    const interval = window.setInterval(() => {
      if (shouldShowReminder()) setVisible(true)
    }, 1000 * 60)

    return () => window.clearInterval(interval)
  }, [installEvent, iosHelp, manualHelp, visible])

  const install = async () => {
    if (!installEvent) return
    installEvent.prompt()
    const choice = await installEvent.userChoice
    if (choice?.outcome === 'accepted') {
      localStorage.setItem('pwa-installed', 'oui')
    }
    setInstallEvent(null)
    setVisible(false)
  }

  const close = () => {
    localStorage.setItem('pwa-install-closed-at', String(Date.now()))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="pwa-install-card" role="dialog" aria-label="Installer l application">
      <div>
        <strong>Installer l application</strong>
        {iosHelp ? (
          <span>Sur iPhone, touchez Partager puis choisissez Sur l ecran d accueil.</span>
        ) : manualHelp && !installEvent ? (
          <span>Sur Android, ouvrez le menu du navigateur puis choisissez Installer l application.</span>
        ) : (
          <span>Ajoutez COFFA sur votre telephone ou ordinateur pour y acceder plus vite.</span>
        )}
      </div>
      {iosHelp ? (
        <span className="pwa-ios-chip"><Share size={18} /> Partager</span>
      ) : manualHelp && !installEvent ? (
        <span className="pwa-ios-chip"><Download size={18} /> Menu navigateur</span>
      ) : (
        <button className="pwa-install-btn" type="button" onClick={install}>
          <Download size={18} />
          <span>Installer</span>
        </button>
      )}
      <button className="pwa-close-btn" type="button" onClick={close} aria-label="Fermer">
        <X size={18} />
      </button>
    </div>
  )
}

export default PwaInstallPrompt
