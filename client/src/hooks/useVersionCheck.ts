import { useEffect } from 'react';

export function useVersionCheck() {
  useEffect(() => {
    let versionCheckInterval: NodeJS.Timeout;

    const checkForNewVersion = async () => {
      try {
        // Fetch version.json with cache-busting
        const response = await fetch(`/version.json?t=${Date.now()}`, {
          cache: 'no-store',
        });
        
        if (!response.ok) return;

        const data = await response.json();
        const currentVersion = localStorage.getItem('appVersion');
        const newVersion = data.version;

        // ✅ If version changed, show refresh prompt
        if (currentVersion && currentVersion !== newVersion) {
          console.log(`🔄 New version available: ${newVersion}`);
          
          // Show browser notification
          if ('showNotification' in Notification || 'Notification' in window) {
            const msg = 'New app version available! Please refresh the page.';
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Roti Hai Update', {
                body: msg,
                icon: '/favicon.ico',
              });
            }
          }

          // Optionally show an alert/banner
          const shouldRefresh = localStorage.getItem('showVersionPrompt') !== 'false';
          if (shouldRefresh) {
            const refresh = confirm('🔄 New version available! Would you like to refresh?');
            if (refresh) {
              location.reload();
            } else {
              localStorage.setItem('showVersionPrompt', 'false');
            }
          }
        } else if (!currentVersion) {
          // First load - just save version
          localStorage.setItem('appVersion', newVersion);
          localStorage.removeItem('showVersionPrompt');
        }
      } catch (error) {
        // Silently fail - version check is non-critical
        console.debug('Version check failed:', error);
      }
    };

    // Check immediately on load
    checkForNewVersion();

    // Check periodically (every 5 minutes)
    versionCheckInterval = setInterval(checkForNewVersion, 5 * 60 * 1000);

    return () => {
      if (versionCheckInterval) clearInterval(versionCheckInterval);
    };
  }, []);
}
