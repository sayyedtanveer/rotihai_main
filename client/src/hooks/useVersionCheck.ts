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

        // ✅ If buildId changed, auto-refresh (don't ask, just refresh)
        if (currentBuildId && currentBuildId !== newBuildId) {
          console.log(`🔄 NEW DEPLOYMENT DETECTED! Version: ${data.version}`);
          
          // Show notification to user
          try {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Roti Hai Updated', {
                body: 'App has been updated to the latest version!',
                icon: '/favicon.ico',
                tag: 'version-update',
              });
            }
          } catch (notifError) {
            console.debug('Notification failed:', notifError);
          }

          // ✅ Auto-refresh after 1 second (smooth transition)
          // This preserves all user data in localStorage automatically
          setTimeout(() => {
            console.log(`🔄 Reloading with new version: ${newBuildId}`);
            // Hard refresh to bypass all caches
            window.location.reload();
          }, 1000);
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
