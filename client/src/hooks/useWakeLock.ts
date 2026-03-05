import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "@/hooks/use-toast";

export function useWakeLock() {
    const [isSupported, setIsSupported] = useState(false);
    const [isAwake, setIsAwake] = useState(false);
    const wakeLockRef = useRef<any>(null); // any because WakeLockSentinel is not fully typed in all TS versions

    useEffect(() => {
        // Check if Wake Lock API is supported
        if ("wakeLock" in navigator) {
            setIsSupported(true);
        }
    }, []);

    const requestWakeLock = useCallback(async () => {
        if (!isSupported) return false;

        try {
            // @ts-ignore - navigator.wakeLock exists if isSupported is true
            wakeLockRef.current = await navigator.wakeLock.request("screen");
            setIsAwake(true);

            // The lock can be released by the system (e.g., low battery, tab backgrounded)
            wakeLockRef.current.addEventListener("release", () => {
                setIsAwake(false);
                console.log("Wake Lock was released by the OS");
            });

            return true;
        } catch (err: any) {
            console.error(`Wake Lock error: ${err.name}, ${err.message}`);
            toast({
                title: "Wake Lock Failed",
                description: "Your browser prevented keeping the screen awake.",
                variant: "destructive",
            });
            setIsAwake(false);
            return false;
        }
    }, [isSupported]);

    const releaseWakeLock = useCallback(async () => {
        if (!wakeLockRef.current) return;

        try {
            await wakeLockRef.current.release();
            wakeLockRef.current = null;
            setIsAwake(false);
        } catch (err) {
            console.error("Error releasing Wake Lock:", err);
        }
    }, []);

    const toggleWakeLock = useCallback(async () => {
        if (isAwake) {
            await releaseWakeLock();
            toast({
                title: "Screen Can Sleep",
                description: "Your screen is no longer locked awake.",
            });
        } else {
            const success = await requestWakeLock();
            if (success) {
                toast({
                    title: "Screen Awake Activated",
                    description: "Your screen will stay on to ensure you don't miss orders.",
                });
            }
        }
    }, [isAwake, requestWakeLock, releaseWakeLock]);

    // Re-acquire wake lock if page becomes visible again (OS drops it on hide)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (wakeLockRef.current !== null && document.visibilityState === "visible") {
                requestWakeLock();
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [requestWakeLock]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (wakeLockRef.current) {
                wakeLockRef.current.release().catch(console.error);
            }
        };
    }, []);

    return { isSupported, isAwake, toggleWakeLock };
}
