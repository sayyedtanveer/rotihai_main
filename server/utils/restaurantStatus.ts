/**
 * Restaurant Status Calculation Engine
 * 
 * Single source of truth for calculating whether a restaurant is currently open.
 * No database writes. No polling. Calculated on-demand only.
 * 
 * Priority:
 * 1. Admin disabled (isActive=false) → Always closed
 * 2. Manual "Close For Today" override → Closed until next schedule opening
 * 3. Auto schedule enabled + valid times → Calculate from schedule
 * 4. Fallback → Open (safe default for invalid config)
 */

/**
 * Configuration for calculating restaurant status
 */
export interface RestaurantConfig {
  /** Admin approval - if false, restaurant is always closed */
  isActive: boolean;
  /** Enable time-based auto scheduling */
  autoScheduleEnabled: boolean;
  /** Opening time in HH:mm format (e.g., "09:00"), nullable */
  openingTime?: string | null;
  /** Closing time in HH:mm format (e.g., "22:00"), nullable */
  closingTime?: string | null;
  /** Manual "Close For Today" override - closed until this time */
  manualOverrideClosed?: { closedUntil: Date };
}

/**
 * Runtime status calculation result
 */
export interface RuntimeStatus {
  /** Whether restaurant is currently open right now */
  isCurrentlyOpen: boolean;
  /** When restaurant will open next (if currently closed), in HH:mm format */
  nextOpeningTime?: string;
  /** When restaurant will close (if currently open), in HH:mm format */
  currentSchedulePeriodEndsAt?: string;
  /** Reason for current status */
  reason: 'admin_disabled' | 'schedule_closed' | 'manual_closed' | 'schedule_open' | 'always_open';
}

/**
 * Helper: Validate time format (HH:mm or HH:mm:ss)
 */
function isValidTimeFormat(time?: string | null): boolean {
  if (!time) return false;
  // Accept both HH:mm and HH:mm:ss formats
  return /^([0-1][0-9]|2[0-3]):([0-5][0-9])(:[0-5][0-9])?$/.test(time);
}

/**
 * Helper: Convert HH:mm or HH:mm:ss string to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const parts = time.split(':').map(Number);
  return parts[0] * 60 + parts[1]; // Only use hours and minutes, ignore seconds
}

/**
 * Helper: Convert minutes since midnight to HH:mm string
 */
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Helper: Get current time in minutes since midnight (IST — UTC+5:30)
 * Server runs in UTC but schedule times are set in IST
 */
function getCurrentTimeInMinutes(now: Date = new Date()): number {
  // Convert UTC to IST (UTC + 5 hours 30 minutes)
  const istOffsetMinutes = 5 * 60 + 30;
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const istMinutes = (utcMinutes + istOffsetMinutes) % (24 * 60);
  return istMinutes;
}

/**
 * Helper: Calculate if restaurant is open within a schedule window
 * Handles overnight schedules (e.g., 20:00-04:00)
 */
function isOpenInScheduleWindow(
  openingTime: string,
  closingTime: string,
  currentTimeInMinutes: number
): boolean {
  const openMins = timeToMinutes(openingTime);
  const closeMins = timeToMinutes(closingTime);

  if (openMins <= closeMins) {
    // Normal case: 09:00-22:00
    return currentTimeInMinutes >= openMins && currentTimeInMinutes < closeMins;
  } else {
    // Overnight case: 20:00-04:00 (close time < open time)
    return currentTimeInMinutes >= openMins || currentTimeInMinutes < closeMins;
  }
}

/**
 * Calculate restaurant status based on configuration
 * 
 * @param config Restaurant configuration (isActive, schedule, overrides)
 * @param now Current time (defaults to now)
 * @returns Status object with isCurrentlyOpen and timing information
 */
export function calculateRestaurantStatus(
  config: RestaurantConfig,
  now: Date = new Date()
): RuntimeStatus {
  // PRIORITY 1: Admin disabled restaurant → Always closed
  if (!config.isActive) {
    console.log('[RESTAURANT-STATUS] Admin disabled (isActive=false)');
    return {
      isCurrentlyOpen: false,
      reason: 'admin_disabled',
      nextOpeningTime: undefined,
      currentSchedulePeriodEndsAt: undefined
    };
  }

  // PRIORITY 2: Manual "Close For Today" override
  if (config.manualOverrideClosed && config.manualOverrideClosed.closedUntil > now) {
    const closedUntilTime = formatTime(
      config.manualOverrideClosed.closedUntil.getHours(),
      config.manualOverrideClosed.closedUntil.getMinutes()
    );
    console.log(`[RESTAURANT-STATUS] Manual close override active until ${closedUntilTime}`);
    return {
      isCurrentlyOpen: false,
      reason: 'manual_closed',
      nextOpeningTime: config.openingTime ?? closedUntilTime,
      currentSchedulePeriodEndsAt: undefined
    };
  }

  // PRIORITY 3: Auto schedule (if enabled with valid times)
  if (config.autoScheduleEnabled && isValidTimeFormat(config.openingTime) && isValidTimeFormat(config.closingTime)) {
    const currentMinutes = getCurrentTimeInMinutes(now);
    const isOpen = isOpenInScheduleWindow(config.openingTime!, config.closingTime!, currentMinutes);

    if (isOpen) {
      console.log(`[RESTAURANT-STATUS] Open per auto-schedule (closes at ${config.closingTime})`);
      return {
        isCurrentlyOpen: true,
        reason: 'schedule_open',
        nextOpeningTime: undefined,
        currentSchedulePeriodEndsAt: config.closingTime ?? undefined
      };
    } else {
      console.log(`[RESTAURANT-STATUS] Closed per auto-schedule (opens at ${config.openingTime})`);
      return {
        isCurrentlyOpen: false,
        reason: 'schedule_closed',
        nextOpeningTime: config.openingTime ?? undefined,
        currentSchedulePeriodEndsAt: undefined
      };
    }
  }

  // PRIORITY 4: Invalid schedule or disabled auto-schedule → Safe fallback (open)
  console.log(`[RESTAURANT-STATUS] Invalid schedule or auto-schedule disabled - defaulting to open | autoScheduleEnabled=${config.autoScheduleEnabled}, openingTime="${config.openingTime}" (valid=${isValidTimeFormat(config.openingTime ?? undefined)}), closingTime="${config.closingTime}" (valid=${isValidTimeFormat(config.closingTime ?? undefined)})`);
  return {
    isCurrentlyOpen: true,
    reason: 'always_open',
    nextOpeningTime: undefined,
    currentSchedulePeriodEndsAt: undefined
  };
}

/**
 * Calculate next scheduled opening time from now
 * Useful for determining "Close For Today" expiration time
 * 
 * @param config Restaurant configuration
 * @param now Current time
 * @returns Date when restaurant will next open per schedule
 */
export function calculateNextScheduledOpening(
  config: RestaurantConfig,
  now: Date = new Date()
): Date {
  if (!config.autoScheduleEnabled || !isValidTimeFormat(config.openingTime)) {
    // No schedule - fallback to 9 AM tomorrow
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow;
  }

  const [openHours, openMins] = config.openingTime!.split(':').map(Number);
  const nextOpen = new Date(now);
  nextOpen.setHours(openHours, openMins, 0, 0);

  // If opening time is in the past today, schedule for tomorrow
  if (nextOpen <= now) {
    nextOpen.setDate(nextOpen.getDate() + 1);
  }

  return nextOpen;
}

/**
 * Format time with hours and minutes
 */
function formatTime(hours: number, minutes: number): string {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * In-memory storage for temporary manual overrides
 * "Close For Today" overrides are stored here and auto-expire
 */
const manualOverrides = new Map<string, { closedUntil: Date }>();

/**
 * Set a "Close For Today" manual override
 * 
 * @param chefId Chef ID
 * @param closedUntil When the override should expire (usually next schedule opening)
 */
export function setManualCloseForToday(chefId: string, closedUntil: Date): void {
  manualOverrides.set(chefId, { closedUntil });
  console.log(`[MANUAL-OVERRIDE] Chef ${chefId} closed for today until ${closedUntil.toISOString()}`);
}

/**
 * Remove manual override (e.g., "Open Now" action)
 * 
 * @param chefId Chef ID
 */
export function clearManualOverride(chefId: string): void {
  manualOverrides.delete(chefId);
  console.log(`[MANUAL-OVERRIDE] Cleared override for chef ${chefId}`);
}

/**
 * Get active manual override for a chef
 * Returns undefined if override expired or doesn't exist
 * 
 * @param chefId Chef ID
 * @returns Override object if active, undefined otherwise
 */
export function getManualOverride(chefId: string, now: Date = new Date()): { closedUntil: Date } | undefined {
  const override = manualOverrides.get(chefId);
  
  // Return undefined if override doesn't exist or has expired
  if (!override || override.closedUntil <= now) {
    return undefined;
  }
  
  return override;
}

/**
 * Build complete restaurant config from chef data
 * Merges database fields with runtime overrides
 * 
 * @param chefData Chef data from database
 * @returns Complete RestaurantConfig for status calculation
 */
export function buildRestaurantConfig(chefData: {
  id: string;
  isActive: boolean;
  autoScheduleEnabled?: boolean;
  openingTime?: string | null;
  closingTime?: string | null;
}): RestaurantConfig {
  const config = {
    isActive: chefData.isActive,
    autoScheduleEnabled: chefData.autoScheduleEnabled ?? false,
    openingTime: chefData.openingTime,
    closingTime: chefData.closingTime,
    manualOverrideClosed: getManualOverride(chefData.id)
  };

  // DEBUG: Log exact values from DB for each chef (remove after confirming fix)
  console.log(`[BUILD-CONFIG] Chef ${chefData.id}: isActive=${chefData.isActive}, autoScheduleEnabled=${chefData.autoScheduleEnabled} (type: ${typeof chefData.autoScheduleEnabled}), openingTime="${chefData.openingTime}" (type: ${typeof chefData.openingTime}), closingTime="${chefData.closingTime}" (type: ${typeof chefData.closingTime}), manualOverride=${config.manualOverrideClosed ? 'YES until ' + config.manualOverrideClosed.closedUntil.toISOString() : 'none'}`);

  return config;
}

/**
 * Validate time format and log errors
 * 
 * @param time Time string to validate
 * @param fieldName Name of field for error messages
 * @returns True if valid, false otherwise
 */
export function validateTimeFormat(time: string | undefined, fieldName: string): boolean {
  if (!time) return true; // Optional field
  
  if (!isValidTimeFormat(time)) {
    console.error(`[VALIDATION] Invalid ${fieldName} format: "${time}". Expected HH:mm (e.g., "09:00")`);
    return false;
  }
  
  return true;
}

/**
 * Validate schedule configuration
 * Returns error message if invalid, null if valid
 * 
 * @param autoScheduleEnabled Whether schedule is enabled
 * @param openingTime Opening time string
 * @param closingTime Closing time string
 * @returns Error message or null
 */
export function validateScheduleConfig(
  autoScheduleEnabled: boolean | undefined,
  openingTime: string | undefined,
  closingTime: string | undefined
): string | null {
  if (!autoScheduleEnabled) {
    return null; // Schedule disabled, validation passes
  }

  // If schedule is enabled, both times are required
  if (!openingTime || !closingTime) {
    return 'Both opening and closing times are required when auto schedule is enabled';
  }

  // Validate formats
  if (!isValidTimeFormat(openingTime)) {
    return `Invalid opening time format: "${openingTime}". Use HH:mm (e.g., "09:00")`;
  }

  if (!isValidTimeFormat(closingTime)) {
    return `Invalid closing time format: "${closingTime}". Use HH:mm (e.g., "22:00")`;
  }

  return null; // Valid
}
