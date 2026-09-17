import React, { useEffect, useState } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import './InstallPrompt.css';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user previously dismissed prompt
    const isDismissed = localStorage.getItem('pwa_install_dismissed') === 'true';
    if (isDismissed) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.warn('[PWA] Prompt error:', err);
    }
  };

  const handleDismiss = (permanent: boolean = true) => {
    setIsVisible(false);
    if (permanent) {
      localStorage.setItem('pwa_install_dismissed', 'true');
    }
  };

  if (!isVisible || !deferredPrompt) return null;

  return (
    <aside className="pwa-install-banner glass-card" aria-label="App installation banner">
      <div className="pwa-install-content">
        <div className="pwa-install-icon">
          <img src="/icon.svg" alt="Amit Meena Weather Icon" className="pwa-install-icon-img" />
        </div>
        <div className="pwa-install-text">
          <strong>Install Amit Meena Weather</strong>
          <p>Add to your home screen for quick offline-ready forecasts &amp; atmospheric alerts.</p>
        </div>
      </div>
      <div className="pwa-install-actions">
        <button className="btn-install-primary" onClick={handleInstallClick}>
          <Download size={15} />
          <span>Install</span>
        </button>
        <button
          className="btn-install-ghost"
          onClick={() => handleDismiss(true)}
          aria-label="Dismiss banner"
        >
          <X size={16} />
        </button>
      </div>
    </aside>
  );
};
