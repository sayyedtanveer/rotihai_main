/**
 * Utility functions for time formatting
 * Converts 24-hour format (HH:mm) to 12-hour format (h:mm AM/PM)
 */

/**
 * Convert time string in 24-hour format to 12-hour AM/PM format
 * @param timeString - Time in "HH:mm" format (e.g., "14:30", "09:00")
 * @returns Formatted time in "h:mm AM/PM" format (e.g., "2:30 PM", "9:00 AM")
 */
export function formatTime12Hour(timeString: string): string {
  try {
    const [hours, mins] = timeString.split(":").map(Number);
    
    // Validate input
    if (isNaN(hours) || isNaN(mins) || hours < 0 || hours > 23 || mins < 0 || mins > 59) {
      console.warn(`Invalid time format: ${timeString}`);
      return timeString; // Return original if invalid
    }
    
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12; // Convert 0 to 12 for midnight, keep others as is
    const displayMins = String(mins).padStart(2, "0");
    
    return `${displayHours}:${displayMins} ${period}`;
  } catch (error) {
    console.warn(`Error formatting time ${timeString}:`, error);
    return timeString; // Return original on error
  }
}

/**
 * Format a delivery slot range in 12-hour format
 * @param startTime - Start time in "HH:mm" format
 * @param endTime - End time in "HH:mm" format
 * @returns Formatted slot range (e.g., "8:00 PM - 9:00 PM")
 */
export function formatSlotRange(startTime: string, endTime: string): string {
  try {
    const start = formatTime12Hour(startTime);
    const end = formatTime12Hour(endTime);
    return `${start} - ${end}`;
  } catch (error) {
    console.warn(`Error formatting slot range:`, error);
    return `${startTime} - ${endTime}`;
  }
}

/**
 * Format delivery slot for display with optional label
 * @param startTime - Start time in "HH:mm" format
 * @param endTime - End time in "HH:mm" format
 * @param label - Optional slot label from admin (e.g., "8:00 PM - 9:00 PM")
 * @returns Formatted slot display
 */
export function formatDeliverySlot(startTime: string, endTime: string, label?: string): string {
  if (label) {
    return label; // Use admin-set label if available
  }
  return formatSlotRange(startTime, endTime);
}

/**
 * Format a full date and time string
 * @param date - Date object or ISO string
 * @param timeString - Time in "HH:mm" format
 * @returns Formatted datetime (e.g., "Nov 15, 2024 at 2:30 PM")
 */
export function formatDateTime12Hour(date: Date | string, timeString: string): string {
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
    const dateStr = dateObj.toLocaleDateString("en-US", options);
    const timeStr = formatTime12Hour(timeString);
    return `${dateStr} at ${timeStr}`;
  } catch (error) {
    console.warn(`Error formatting datetime:`, error);
    return "";
  }
}

/**
 * Format delivery time for display with better readability
 * @param timeString - Time in "HH:mm" format
 * @returns Formatted time with emoji (e.g., "🕐 2:30 PM")
 */
export function formatDeliveryTime(timeString: string): string {
  const formatted = formatTime12Hour(timeString);
  return `🕐 ${formatted}`;
}

export const BUSINESS_TIMEZONE = 'Asia/Kolkata';

/**
 * Get current business date in Asia/Kolkata as YYYY-MM-DD
 */
export function getBusinessToday(): string {
  const now = new Date();
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const todayIST = new Date(now.getTime() + IST_OFFSET_MS);
  
  const yyyy = todayIST.getUTCFullYear();
  const mm = String(todayIST.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(todayIST.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Get tomorrow's calendar date in Asia/Kolkata as YYYY-MM-DD
 */
export function getBusinessTomorrow(): string {
  const now = new Date();
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  
  // Shift to IST exactly, then push forward 24 hours
  const tomorrowIST = new Date(now.getTime() + IST_OFFSET_MS + ONE_DAY_MS);
  
  // Extract strictly using UTC methods so the server's local TZ is ignored
  const yyyy = tomorrowIST.getUTCFullYear();
  const mm = String(tomorrowIST.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(tomorrowIST.getUTCDate()).padStart(2, '0');
  
  return `${yyyy}-${mm}-${dd}`;
}

/** 
 * Format a Date object strictly to Asia/Kolkata YYYY-MM-DD
 */
export function getBusinessDateStringFromDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Fallback to Intl for formatting an absolute Date into Kolkata timezone
  return new Intl.DateTimeFormat('en-CA', { 
    timeZone: BUSINESS_TIMEZONE, 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  }).format(d);
}

/** 
 * Creates an exact UTC Date object for a given YYYY-MM-DD and HH:mm in IST 
 */
export function createBusinessDateTime(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr}:00+05:30`);
}
