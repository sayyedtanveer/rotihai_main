/**
 * Keep-alive utility to prevent Render free tier app spindown
 * Pings the health endpoint periodically to keep the server warm
 */

let keepAliveIntervalId: NodeJS.Timeout | null = null;

export function startKeepAlive(intervalMinutes: number = 10): void {
  // Don't start multiple intervals
  if (keepAliveIntervalId) {
    console.log("Keep-alive already running");
    return;
  }

  const intervalMs = intervalMinutes * 60 * 1000;

  console.log(`🔄 Starting keep-alive ping every ${intervalMinutes} minutes`);

  // Send first ping immediately
  pingServer();

  // Then ping periodically
  keepAliveIntervalId = setInterval(pingServer, intervalMs);
}

async function pingServer(): Promise<void> {
  try {
    const response = await fetch("/api/health");
    if (response.ok) {
      const data = await response.json();
      console.log("✅ Keep-alive ping successful", data.timestamp);
    } else {
      console.warn("Keep-alive ping returned non-OK status:", response.status);
    }
  } catch (error) {
    console.debug("Keep-alive ping failed (non-critical - server may be starting)");
  }
}

export function stopKeepAlive(): void {
  if (keepAliveIntervalId) {
    clearInterval(keepAliveIntervalId);
    keepAliveIntervalId = null;
    console.log("🛑 Keep-alive stopped");
  }
}
