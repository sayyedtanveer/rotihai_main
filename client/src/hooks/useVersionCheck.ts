import { useEffect } from 'react';

export function useVersionCheck() {
  useEffect(() => {
    let versionCheckInterval: NodeJS.Timeout;

    const checkForNewVersion = async () => {
      try {
        // Fetch version.json with cache-busting - ALWAYS fresh
        const response = await fetch(`/version.json?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Pragma': 'no-cache',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          }
        });
        
        if (!response.ok) return;

        const data = await response.json();
        const currentBuildId = localStorage.getItem('appBuildId');
        const newBuildId = data.buildId;

        console.log(`📦 Version check - Current: ${currentBuildId}, Latest: ${newBuildId}`);

        // ✅ If buildId changed, do a HARD reload that bypasses the Service Worker cache.
        // window.location.reload() is a soft reload — the active SW intercepts it and may
        // serve old cached files, defeating the purpose. We unregister the SW first, then
        // navigate, so the browser fetches fresh assets directly from the server.
        if (currentBuildId && currentBuildId !== newBuildId) {
          console.log(`🔄 NEW DEPLOYMENT DETECTED! Version: ${data.version}. Performing hard reload.`);

          // Save the new buildId NOW so we don't loop on the next load
          localStorage.setItem('appBuildId', newBuildId);
          localStorage.setItem('appVersion', data.version);

          // Unregister SW then navigate (hard reload)
          const doHardReload = async () => {
            if ('serviceWorker' in navigator) {
              try {
                const registrations = await navigator.serviceWorker.getRegistrations();
                await Promise.all(registrations.map(r => r.unregister()));
                console.log('🔄 Service workers unregistered. Reloading...');
              } catch (e) {
                console.debug('SW unregister error (non-fatal):', e);
              }
            }
            // Full navigation — not interceptable by a SW
            window.location.href = window.location.href;
          };

          setTimeout(doHardReload, 1000);

        } else if (!currentBuildId && newBuildId) {
          // First load - just save buildId
          console.log(`📦 Initial load - saving buildId: ${newBuildId}`);
          localStorage.setItem('appBuildId', newBuildId);
          localStorage.setItem('appVersion', data.version);
        } else if (currentBuildId === newBuildId) {
          // Same version - no action needed
          console.log(`✅ App is running latest version`);
        }
      } catch (error) {
        console.debug('Version check failed:', error);
      }
    };

    // Check immediately on load
    checkForNewVersion();

    // Check frequently for production (every 2 minutes)
    versionCheckInterval = setInterval(checkForNewVersion, 2 * 60 * 1000);

    return () => {
      if (versionCheckInterval) clearInterval(versionCheckInterval);
    };
  }, []);
}
