import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertOrderSchema, userLoginSchema, insertUserSchema } from "@shared/schema";
import { registerAdminRoutes } from "./adminRoutes";
import { registerPartnerRoutes } from "./partnerRoutes";
import { registerDeliveryRoutes } from "./deliveryRoutes";
import { setupWebSocket, broadcastNewOrder, broadcastSubscriptionDelivery, broadcastNewSubscriptionToAdmin, broadcastSubscriptionAssignmentToPartner, broadcastWalletUpdate } from "./websocket";
import { hashPassword, verifyPassword, generateAccessToken, generateRefreshToken, requireUser, type AuthenticatedUserRequest } from "./userAuth";
import { verifyToken as verifyUserToken } from "./userAuth";
import { requireAdmin } from "./adminAuth";
import { sendEmail, createWelcomeEmail, createPasswordResetEmail, createPasswordChangeConfirmationEmail } from "./emailService";
import { sendOrderPlacedAdminNotification } from "./whatsappService";
import { db, subscriptions, orders, walletSettings, referralRewards } from "@shared/db";
import { eq } from "drizzle-orm";
import { ZodError } from "zod";
import axios from "axios";

export async function registerRoutes(app: Express): Promise<Server> {
  registerAdminRoutes(app);
  registerPartnerRoutes(app);
  registerDeliveryRoutes(app);

  // Helper: compute cutoff hours before a slot based on its start time.
  // We don't currently store per-slot cutoff in the DB, so infer a reasonable default:
  // - Morning Roti slots (08:00 to 11:00) require ordering the previous day by 11 PM
  //   This means: 8 AM slot = 9 hours before, 9 AM = 10 hours, 10 AM = 11 hours, 11 AM = 12 hours
  // - Very early morning slots (before 08:00) require ordering previous day ~10 hours before
  // - Other slots default to 4 hours cutoff
  // Determine cutoff hours for a slot. Prefer per-slot config `cutoffHoursBefore` when available,
  // otherwise fall back to a reasonable default based on startTime.
  const getCutoffHoursBefore = (slotOrStartTime: any) => {
    try {
      // If slot object passed and has explicit cutoff configured, use it
      const slot = typeof slotOrStartTime === 'object' ? slotOrStartTime : null;
      if (slot && typeof slot.cutoffHoursBefore === 'number' && isFinite(slot.cutoffHoursBefore)) {
        return Math.max(0, Math.trunc(slot.cutoffHoursBefore));
      }

      const startTime = typeof slotOrStartTime === 'string' ? slotOrStartTime : slot?.startTime || '00:00';
      const parts = (startTime || "00:00").split(":");
      const hour = parseInt(parts[0], 10);
      if (!isFinite(hour)) return 4;

      // Morning Roti slots (8 AM to 11 AM inclusive) require booking by 11 PM previous day
      // Formula: cutoffHours = hour + 13 (e.g., 8 AM slot needs 21 hours before = 11 PM previous day)
      if (hour >= 8 && hour < 11) {
        return hour + 13;
      }

      // Very early morning slots (before 8 AM) require 10 hours advance booking
      if (hour < 8) {
        return 10;
      }

      // Evening/afternoon slots (noon onwards): use 1 hour cutoff
      // This means if it's 2 PM and user selects 2 PM, it will be next day
      // User must select 3 PM or later for same-day delivery
      if (hour >= 12) {
        return 1;
      }

      // Mid-morning slots (11 AM - noon): 4 hours cutoff
      return 4;
    } catch (e) {
      return 4;
    }
  };

  const computeSlotCutoffInfo = (slot: any) => {
    const now = new Date();
    console.log(`[CUTOFF] Starting computation - now: ${now.toISOString()}, slot.startTime: ${slot?.startTime}`);
    
    const currentHour = now.getHours();
    const [hStr, mStr] = (slot?.startTime || "00:00").split(":");
    const h = parseInt(hStr || "0", 10) || 0;
    const m = parseInt(mStr || "0", 10) || 0;

    console.log(`[CUTOFF] Parsed time - h: ${h}, m: ${m}, currentHour: ${currentHour}`);

    // Check if this is a morning slot (8 AM to 11 AM)
    const isMorningSlot = h >= 8 && h < 11;
    console.log(`[CUTOFF] Is morning slot: ${isMorningSlot}`);

    // Build a Date for today's occurrence of the slot
    const todaySlot = new Date(now);
    todaySlot.setHours(h, m, 0, 0);
    console.log(`[CUTOFF] Today slot time: ${todaySlot.toISOString()}`);

    // Check if this time slot has already passed today (current time > slot time)
    const slotHasPassed = now > todaySlot;
    console.log(`[CUTOFF] Slot has passed today: ${slotHasPassed}`);

    // Get cutoff hours
    const cutoffHours = getCutoffHoursBefore(slot);
    console.log(`[CUTOFF] Cutoff hours before: ${cutoffHours}`);
    
    // For today's delivery, calculate cutoff time
    const cutoffMs = cutoffHours * 60 * 60 * 1000;
    const todayCutoffTime = new Date(todaySlot.getTime() - cutoffMs);
    console.log(`[CUTOFF] Today cutoff time: ${todayCutoffTime.toISOString()}`);
    
    // Determine if we can still order for today's slot
    let deliveryDate: Date;
    let isPastCutoff: boolean;
    let cutoffDate: Date;

    // Logic: If slot time has passed OR we're past the cutoff time, deliver tomorrow
    if (slotHasPassed || now > todayCutoffTime) {
      console.log(`[CUTOFF] Past cutoff - scheduling for tomorrow`);
      // Schedule for tomorrow
      deliveryDate = new Date(todaySlot);
      deliveryDate.setDate(deliveryDate.getDate() + 1);
      isPastCutoff = true;
      
      console.log(`[CUTOFF] Tomorrow delivery date: ${deliveryDate.toISOString()}`);
      
      // Calculate tomorrow's cutoff
      const tomorrowSlot = new Date(deliveryDate);
      cutoffDate = new Date(tomorrowSlot.getTime() - cutoffMs);
      console.log(`[CUTOFF] Tomorrow cutoff: ${cutoffDate.toISOString()}`);
    } else {
      console.log(`[CUTOFF] Can deliver today`);
      // Can still deliver today
      deliveryDate = todaySlot;
      isPastCutoff = false;
      cutoffDate = todayCutoffTime;
      console.log(`[CUTOFF] Today delivery date: ${deliveryDate.toISOString()}`);
    }

    const result = {
      cutoffHoursBefore: cutoffHours,
      cutoffHours: cutoffHours,
      cutoffDate,
      isPastCutoff,
      nextAvailableDate: deliveryDate,
      isMorningSlot,
      slotHasPassed,
      inMorningRestriction: currentHour >= 8 && currentHour < 11,
    };
    
    console.log(`[CUTOFF] Final result - nextAvailableDate: ${deliveryDate.toISOString()}, year: ${deliveryDate.getFullYear()}`);
    return result;
  };

  // Coupon verification route (supports optional userId for per-user limit checking)
  app.post("/api/coupons/verify", async (req: any, res) => {
    try {
      const { code, orderAmount, userId: providedUserId } = req.body;

      // Validate coupon code
      if (!code || typeof code !== 'string' || code.trim().length === 0) {
        res.status(400).json({ message: "Coupon code is required" });
        return;
      }

      // Validate order amount
      if (!orderAmount || typeof orderAmount !== 'number' || orderAmount <= 0 || !isFinite(orderAmount)) {
        res.status(400).json({ message: "Valid order amount is required" });
        return;
      }

      // Sanitize and validate userId if provided
      let userId: string | undefined = providedUserId;
      if (providedUserId && typeof providedUserId === 'string') {
        userId = providedUserId.trim();
      }

      // Try to get userId from auth header
      if (!userId && req.headers.authorization?.startsWith("Bearer ")) {
        try {
          const token = req.headers.authorization.substring(7);
          const payload = verifyUserToken(token);
          if (payload?.userId) userId = payload.userId;
        } catch (tokenError) {
          // Token verification failed, continue without userId
          console.log("Token verification failed for coupon, continuing without userId");
        }
      }

      const result = await storage.verifyCoupon(code.trim().toUpperCase(), orderAmount, userId);

      if (!result) {
        res.status(404).json({ message: "Invalid coupon code" });
        return;
      }

      res.json(result);
    } catch (error: any) {
      console.error("Coupon verification error:", error);
      res.status(400).json({ message: error.message || "Failed to verify coupon" });
    }
  });

  // Track visitor analytics - only frontend pages (exclude admin, partner, delivery)
  app.post("/api/track-visitor", async (req, res) => {
    try {
      const { userId, sessionId, page, userAgent, referrer } = req.body;
      
      // Skip tracking for admin, partner, and delivery routes
      if (page && (page.startsWith("/admin") || page.startsWith("/partner") || page.startsWith("/delivery"))) {
        res.json({ success: true });
        return;
      }

      const visitorData = {
        userId: userId || null,
        sessionId: sessionId || `session-${Date.now()}`,
        page: page || "/",
        userAgent: userAgent || req.get("user-agent") || "Unknown",
        ipAddress: req.ip || req.connection.remoteAddress || "Unknown",
        referrer: referrer || null,
      };

      await storage.trackVisitor(visitorData);
      res.json({ success: true });
    } catch (error) {
      console.error("Visitor tracking error:", error);
      // Don't fail the request, just log the error
      res.json({ success: true });
    }
  });

  // Get available delivery time slots (public endpoint)
  app.get("/api/delivery-slots", async (req, res) => {
    try {
      const slots = await storage.getActiveDeliveryTimeSlots();
      res.json(slots);
    } catch (error) {
      console.error("Error fetching delivery slots:", error);
      res.status(500).json({ message: "Failed to fetch delivery slots" });
    }
  });

  // Check if phone number exists
  app.post("/api/user/check-phone", async (req, res) => {
    try {
      const { phone } = req.body;

      if (!phone) {
        res.status(400).json({ message: "Phone number is required" });
        return;
      }

      const user = await storage.getUserByPhone(phone);
      res.json({ exists: !!user });
    } catch (error) {
      console.error("Phone check error:", error);
      res.status(500).json({ message: "Failed to check phone number" });
    }
  });

  // Reset password endpoint (Forgot Password)
  app.post("/api/user/reset-password", async (req, res) => {
    try {
      const { phone } = req.body;

      if (!phone) {
        res.status(400).json({ message: "Phone number is required" });
        return;
      }

      const user = await storage.getUserByPhone(phone);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      // Generate new password (last 6 digits of phone - same as default)
      const newPassword = phone.slice(-6);
      const passwordHash = await hashPassword(newPassword);

      await storage.updateUser(user.id, { passwordHash });

      // Send password reset email if user has email
      let emailSent = false;
      if (user.email) {
        const emailHtml = createPasswordResetEmail(user.name, user.phone, newPassword);
        emailSent = await sendEmail({
          to: user.email,
          subject: '🔐 Password Reset - RotiHai',
          html: emailHtml,
        });
      }

      res.json({
        message: emailSent
          ? "Password reset successful! Check your email for the new password."
          : "Password reset successful. Your new password is the last 6 digits of your phone number.",
        newPassword: !emailSent ? newPassword : undefined,
        emailSent,
        hint: "Use the last 6 digits of your phone number to login"
      });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Change password endpoint (for logged-in users)
  app.post("/api/user/change-password", requireUser(), async (req: AuthenticatedUserRequest, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        res.status(400).json({ message: "Current password and new password are required" });
        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({ message: "New password must be at least 6 characters long" });
        return;
      }

      const userId = req.authenticatedUser!.userId;
      const user = await storage.getUser(userId);

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      // Verify current password
      const isValid = await verifyPassword(currentPassword, user.passwordHash);
      if (!isValid) {
        res.status(401).json({ message: "Current password is incorrect" });
        return;
      }

      // Update to new password
      const newPasswordHash = await hashPassword(newPassword);
      await storage.updateUser(user.id, { passwordHash: newPasswordHash });

      // Send confirmation email if user has email
      if (user.email) {
        const emailHtml = createPasswordChangeConfirmationEmail(user.name, user.phone);
        await sendEmail({
          to: user.email,
          subject: '✅ Password Changed Successfully - RotiHai',
          html: emailHtml,
        });
      }

      res.json({
        message: "Password changed successfully",
        success: true
      });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // User phone-based authentication routes
  app.post("/api/user/register", async (req, res) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        console.error("User registration validation failed:", result.error.flatten());
        res.status(400).json({ 
          message: "Invalid user data", 
          errors: result.error.flatten().fieldErrors 
        });
        return;
      }

      // Sanitize phone number
      const sanitizedPhone = result.data.phone.trim().replace(/\s+/g, '');

      // Allow multiple phone numbers per email (Zomato-like behavior)
      // Just check if this exact phone number is already registered
      const existingPhoneUser = await storage.getUserByPhone(sanitizedPhone);
      if (existingPhoneUser) {
        res.status(409).json({ message: "Phone number already registered. Please use a different phone number." });
        return;
      }

      const passwordHash = await hashPassword(result.data.password);
      const user = await storage.createUser({
        name: result.data.name.trim(),
        phone: sanitizedPhone,
        email: result.data.email ? result.data.email.trim().toLowerCase() : null,
        address: result.data.address ? result.data.address.trim() : null,
        passwordHash,
        referralCode: null,
        walletBalance: 0,
      });

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      console.log(`✅ User registered successfully: ${user.id}`);

      res.json({
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          address: user.address,
        },
        accessToken,
        refreshToken,
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(500).json({ 
        message: error.message || "Failed to register user" 
      });
    }
  });

  // ✅ User login
  app.post("/api/user/login", async (req, res) => {
    try {
      const { phone, password } = req.body;

      if (!phone || !password) {
        res.status(400).json({ message: "Phone and password are required" });
        return;
      }

      const user = await storage.getUserByPhone(phone);
      if (!user) {
        res.status(401).json({ message: "Invalid phone number or password" });
        return;
      }

      const passwordMatch = await verifyPassword(password, user.passwordHash);
      if (!passwordMatch) {
        res.status(401).json({ message: "Invalid phone number or password" });
        return;
      }

      await storage.updateUserLastLogin(user.id);
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      res.json({
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          address: user.address,
        },
        accessToken,
        refreshToken,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  // ✅ Forgot password - send new password via email
  app.post("/api/user/forgot-password", async (req, res) => {
    try {
      const { phone } = req.body;

      if (!phone || phone.length !== 10) {
        res.status(400).json({ message: "Valid 10-digit phone number is required" });
        return;
      }

      const user = await storage.getUserByPhone(phone);
      if (!user) {
        res.status(404).json({ message: "No account found with this phone number" });
        return;
      }

      if (!user.email) {
        res.status(400).json({
          message: "No email address registered for this account. Please contact support."
        });
        return;
      }

      // Generate a new temporary password (8 characters)
      const tempPassword = Math.random().toString(36).slice(-8).toUpperCase();
      const hashedPassword = await hashPassword(tempPassword);

      // Update user password
      await storage.updateUser(user.id, { passwordHash: hashedPassword });

      // Send email with new password
      await sendEmail({
        to: user.email,
        subject: '🔐 Password Reset - RotiHai',
        html: createPasswordResetEmail(user.name, user.phone, tempPassword),
      });

      res.json({
        message: "A new password has been sent to your registered email address",
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({
        message: "Failed to reset password. Please try again later."
      });
    }
  });

  // User logout (JWT-based)
app.post("/api/user/logout", async (req, res) => {
  try {
    // For JWT, logout simply means the client deletes the token.
    // (Tokens are stateless — there's nothing to invalidate on the server)
    // However, we could later add refresh token blacklisting here if needed.

    console.log("User logout requested");

    res.json({ message: "Logged out successfully" });
  } catch (error: any) {
    console.error("Logout error:", error);
    res.status(500).json({ message: error.message || "Failed to logout" });
  }
});


  app.post("/api/user/auto-register", async (req, res) => {
    try {
      const { customerName, phone, email, address } = req.body;

      if (!customerName || !phone) {
        res.status(400).json({ message: "Name and phone are required" });
        return;
      }

      let user = await storage.getUserByPhone(phone);
      let isNewUser = false;
      let generatedPassword;
      let emailSent = false;

      if (!user) {
        isNewUser = true;
        // Default password: last 6 digits of phone number
        generatedPassword = phone.slice(-6);

        if (!generatedPassword || generatedPassword.length < 6) {
          return res.status(400).json({ message: "Invalid phone number: must be at least 6 digits" });
        }

        const passwordHash = await hashPassword(generatedPassword);
        user = await storage.createUser({
          name: customerName,
          phone,
          email: email || null,
          address: address || null,
          passwordHash,
          referralCode: null,
          walletBalance: 0,
        });
        console.log("New user created:", user.id, "- Default password:", generatedPassword);

        // Send welcome email with password if email is provided
        if (email) {
          const emailHtml = createWelcomeEmail(customerName, phone, generatedPassword);
          emailSent = await sendEmail({
            to: email,
            subject: '🍽️ Welcome to RotiHai - Your Account Details',
            html: emailHtml,
          });

          if (emailSent) {
            console.log(`✅ Welcome email sent to ${email}`);
          }
        }
      } else {
        await storage.updateUserLastLogin(user.id);
        console.log("Existing user logged in:", user.id);
      }

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      res.json({
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          address: user.address,
        },
        accessToken,
        refreshToken,
        defaultPassword: isNewUser ? generatedPassword : undefined,
        emailSent: isNewUser ? emailSent : undefined,
      });
    } catch (error) {
      console.error("Auto-register error:", error);
      res.status(500).json({ message: "Failed to auto-register" });
    }
  });

  app.get("/api/user/profile", requireUser(), async (req: AuthenticatedUserRequest, res) => {
    try {
      const user = await storage.getUser(req.authenticatedUser!.userId);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      // Get referral bonus info if user was referred
      let pendingBonus = null;
      const referral = await (await import("@shared/db")).db.query.referrals.findFirst({
        where: (r, { eq }) => eq(r.referredId, user.id),
      });

      if (referral && referral.status === "pending") {
        const settings = await storage.getActiveReferralReward();
        pendingBonus = {
          amount: referral.referredBonus,
          minOrderAmount: settings?.minOrderAmount || 0,
          code: referral.referralCode,
          referrerName: (await storage.getUser(referral.referrerId))?.name,
        };
      }

      res.json({
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        address: user.address,
        referralCode: user.referralCode,
        walletBalance: user.walletBalance || 0,
        pendingBonus,
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Update user profile
  app.put("/api/user/profile", requireUser(), async (req: AuthenticatedUserRequest, res) => {
    try {
      const userId = req.authenticatedUser!.userId;
      const { name, email, address } = req.body;

      // Validate email if provided
      if (email && (typeof email !== 'string' || !email.includes('@'))) {
        res.status(400).json({ message: "Valid email is required" });
        return;
      }

      const user = await storage.getUser(userId);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      const updateData: any = {};
      if (name && typeof name === 'string') updateData.name = name.trim();
      if (email && typeof email === 'string') updateData.email = email.trim();
      if (address && typeof address === 'string') updateData.address = address.trim();

      if (Object.keys(updateData).length === 0) {
        res.status(400).json({ message: "No valid fields to update" });
        return;
      }

      await storage.updateUser(userId, updateData);

      const updatedUser = await storage.getUser(userId);
      res.json({
        id: updatedUser!.id,
        name: updatedUser!.name,
        phone: updatedUser!.phone,
        email: updatedUser!.email,
        address: updatedUser!.address,
        referralCode: updatedUser!.referralCode,
        walletBalance: updatedUser!.walletBalance || 0,
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Get public referral settings
  app.get("/api/referral-settings", async (req, res) => {
    try {
      const settings = await storage.getActiveReferralReward();
      if (!settings) {
        res.json({
          referrerBonus: 50,
          referredBonus: 50,
          minOrderAmount: 100,
          maxReferralsPerMonth: 10,
          maxEarningsPerMonth: 500,
          expiryDays: 30,
        });
        return;
      }
      res.json({
        referrerBonus: settings.referrerBonus,
        referredBonus: settings.referredBonus,
        minOrderAmount: settings.minOrderAmount,
        maxReferralsPerMonth: settings.maxReferralsPerMonth,
        maxEarningsPerMonth: settings.maxEarningsPerMonth,
        expiryDays: settings.expiryDays,
      });
    } catch (error) {
      console.error("Error fetching referral settings:", error);
      res.status(500).json({ message: "Failed to fetch referral settings" });
    }
  });

  // Generate referral code for user
  app.post("/api/user/generate-referral", requireUser(), async (req: AuthenticatedUserRequest, res) => {
    try {
      const userId = req.authenticatedUser!.userId;
      const user = await storage.getUser(userId);

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      if (user.referralCode) {
        res.json({ referralCode: user.referralCode });
        return;
      }

      const referralCode = await storage.generateReferralCode(userId);
      res.json({ referralCode });
    } catch (error: any) {
      console.error("Error generating referral code:", error);
      res.status(500).json({ message: error.message || "Failed to generate referral code" });
    }
  });

  // Apply referral code during registration
  app.post("/api/user/apply-referral", requireUser(), async (req: AuthenticatedUserRequest, res) => {
    try {
      const userId = req.authenticatedUser!.userId;
      const { referralCode } = req.body;

      if (!referralCode) {
        res.status(400).json({ message: "Referral code is required" });
        return;
      }

      // Check if system is enabled
      const settings = await storage.getActiveReferralReward();
      if (!settings?.isActive) {
        return res.status(400).json({ message: "Referral system is currently disabled" });
      }

      await storage.applyReferralBonus(referralCode, userId);
      
      const bonus = settings.referredBonus || 50;
      res.json({ 
        message: "Referral bonus applied successfully", 
        bonus,
        note: "Bonus is credited to your wallet. It will be available for your next order."
      });
    } catch (error: any) {
      console.error("Error applying referral:", error);
      res.status(400).json({ message: error.message || "Failed to apply referral" });
    }
  });

  // Get user's referrals
  app.get("/api/user/referrals", requireUser(), async (req: AuthenticatedUserRequest, res) => {
    try {
      const userId = req.authenticatedUser!.userId;
      const referrals = await storage.getReferralsByUser(userId);
      res.json(referrals);
    } catch (error: any) {
      console.error("Error fetching referrals:", error);
      res.status(500).json({ message: error.message || "Failed to fetch referrals" });
    }
  });

  // Get user's referral code
  app.get("/api/user/referral-code", requireUser(), async (req: AuthenticatedUserRequest, res) => {
    try {
      const userId = req.authenticatedUser!.userId;
      const referralCode = await storage.getUserReferralCode(userId);

      if (!referralCode) {
        res.status(404).json({ message: "No referral code found. Generate one first." });
        return;
      }

      res.json({ referralCode });
    } catch (error: any) {
      console.error("Error fetching referral code:", error);
      res.status(500).json({ message: error.message || "Failed to fetch referral code" });
    }
  });

  // Check if user is eligible to apply a referral code
  app.get("/api/user/referral-eligibility", requireUser(), async (req: AuthenticatedUserRequest, res) => {
    try {
      const userId = req.authenticatedUser!.userId;

      // Check if user has already applied a referral code
      const referral = await storage.getReferralByReferredId(userId);

      if (referral) {
        res.json({ eligible: false, reason: "You have already used a referral code" });
        return;
      }

      res.json({ eligible: true });
    } catch (error: any) {
      console.error("Error checking referral eligibility:", error);
      res.status(500).json({ message: error.message || "Failed to check eligibility" });
    }
  });

  // Get user's wallet balance
  app.get("/api/user/wallet", requireUser(), async (req: AuthenticatedUserRequest, res) => {
    try {
      const userId = req.authenticatedUser!.userId;
      const balance = await storage.getUserWalletBalance(userId);
      res.json({ balance });
    } catch (error: any) {
      console.error("Error fetching wallet balance:", error);
      res.status(500).json({ message: error.message || "Failed to fetch wallet balance" });
    }
  });

  // Get wallet transactions
  app.get("/api/user/wallet/transactions", requireUser(), async (req: AuthenticatedUserRequest, res) => {
    try {
      const userId = req.authenticatedUser!.userId;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const transactions = await storage.getWalletTransactions(userId, limit);
      res.json(transactions);
    } catch (error: any) {
      console.error("Error fetching wallet transactions:", error);
      res.status(500).json({ message: error.message || "Failed to fetch wallet transactions" });
    }
  });

  // Get referral stats
  app.get("/api/user/referral-stats", requireUser(), async (req: AuthenticatedUserRequest, res) => {
    try {
      const userId = req.authenticatedUser!.userId;
      const stats = await storage.getReferralStats(userId);
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching referral stats:", error);
      res.status(500).json({ message: error.message || "Failed to fetch referral stats" });
    }
  });

  // Check if user is eligible to claim referral bonus at checkout
  app.post("/api/user/check-bonus-eligibility", requireUser(), async (req: AuthenticatedUserRequest, res) => {
    try {
      const userId = req.authenticatedUser!.userId;
      const { orderTotal } = req.body;

      if (!orderTotal || orderTotal <= 0) {
        return res.status(400).json({ message: "Order total is required and must be greater than 0" });
      }

      const eligibility = await storage.validateBonusEligibility(userId, orderTotal);
      res.json(eligibility);
    } catch (error: any) {
      console.error("Error checking bonus eligibility:", error);
      res.status(500).json({ message: error.message || "Failed to check bonus eligibility" });
    }
  });

  // Claim referral bonus at checkout
  app.post("/api/user/claim-bonus-at-checkout", requireUser(), async (req: AuthenticatedUserRequest, res) => {
    try {
      const userId = req.authenticatedUser!.userId;
      const { orderTotal, orderId } = req.body;

      if (!orderTotal || orderTotal <= 0) {
        return res.status(400).json({ message: "Order total is required and must be greater than 0" });
      }

      if (!orderId) {
        return res.status(400).json({ message: "Order ID is required" });
      }

      const result = await storage.claimReferralBonusAtCheckout(userId, orderTotal, orderId);
      
      if (result.bonusClaimed) {
        return res.json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error: any) {
      console.error("Error claiming bonus:", error);
      res.status(500).json({ message: error.message || "Failed to claim bonus" });
    }
  });


  // Get subscription delivery schedule
  app.get("/api/subscriptions/:id/schedule", requireUser(), async (req: AuthenticatedUserRequest, res) => {
    try {
      const userId = req.authenticatedUser!.userId;
      const subscription = await storage.getSubscription(req.params.id);

      if (!subscription) {
        res.status(404).json({ message: "Subscription not found" });
        return;
      }

      if (subscription.userId !== userId) {
        res.status(403).json({ message: "Unauthorized" });
        return;
      }

      const plan = await storage.getSubscriptionPlan(subscription.planId);
      if (!plan) {
        res.status(404).json({ message: "Plan not found" });
        return;
      }

      const deliveryDays = plan.deliveryDays as string[];
      const schedule = [];
      const currentDate = new Date(subscription.nextDeliveryDate);
      const endDate = subscription.endDate ? new Date(subscription.endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      while (currentDate <= endDate && schedule.length < subscription.remainingDeliveries) {
        const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

        if (deliveryDays.includes(dayName)) {
          schedule.push({
            date: new Date(currentDate),
            time: subscription.nextDeliveryTime,
            items: plan.items,
            status: currentDate < new Date() ? "delivered" : "pending"
          });
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      res.json({
        subscription,
        plan,
        schedule,
        remainingDeliveries: subscription.remainingDeliveries,
        totalDeliveries: subscription.totalDeliveries,
        deliveryHistory: subscription.deliveryHistory || []
      });
    } catch (error: any) {
      console.error("Error fetching subscription schedule:", error);
      res.status(500).json({ message: error.message || "Failed to fetch schedule" });
    }
  });

  // Mark delivery as completed (called by delivery personnel or auto-scheduled)
  app.post("/api/subscriptions/:id/complete-delivery", requireUser(), async (req: AuthenticatedUserRequest, res) => {
    try {
      const subscription = await storage.getSubscription(req.params.id);

      if (!subscription) {
        res.status(404).json({ message: "Subscription not found" });
        return;
      }

      if (!subscription.isPaid) {
        res.status(400).json({ message: "Subscription not paid" });
        return;
      }

      const plan = await storage.getSubscriptionPlan(subscription.planId);
      if (!plan) {
        res.status(404).json({ message: "Plan not found" });
        return;
      }

      const deliveryHistory = (subscription.deliveryHistory as any[]) || [];
      const now = new Date();

      deliveryHistory.push({
        deliveredAt: now,
        items: plan.items,
        deliveryDate: subscription.nextDeliveryDate,
        deliveryTime: subscription.nextDeliveryTime
      });

      const remainingDeliveries = subscription.remainingDeliveries - 1;
      const deliveryDays = plan.deliveryDays as string[];

      // Calculate next delivery date
      let nextDelivery = new Date(subscription.nextDeliveryDate);
      nextDelivery.setDate(nextDelivery.getDate() + 1);

      while (nextDelivery <= (subscription.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000))) {
        const dayName = nextDelivery.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        if (deliveryDays.includes(dayName)) {
          break;
        }
        nextDelivery.setDate(nextDelivery.getDate() + 1);
      }

      const updateData: any = {
        remainingDeliveries,
        lastDeliveryDate: now,
        deliveryHistory,
        nextDeliveryDate: nextDelivery
      };

      if (remainingDeliveries <= 0) {
        updateData.status = "completed";
      }

      const updated = await storage.updateSubscription(req.params.id, updateData);
      if (!updated) {
        res.status(500).json({ message: "Failed to update subscription" });
        return;
      }

      // Broadcast subscription delivery update to assigned chef
      if (updated.chefId) {
        broadcastSubscriptionDelivery(updated);
      }

      res.json({ message: "Delivery completed", subscription: updated });
    } catch (error: any) {
      console.error("Error completing delivery:", error);
      res.status(500).json({ message: error.message || "Failed to complete delivery" });
    }
  });

  app.get("/api/user/orders", requireUser(), async (req: AuthenticatedUserRequest, res) => {
    try {
      const userId = req.authenticatedUser!.userId;
      console.log("GET /api/user/orders - User ID:", userId);

      // Get user to find their phone number
      const user = await storage.getUser(userId);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      console.log("GET /api/user/orders - User phone:", user.phone);

      // Get delivery settings to determine minimum order amount
      const deliverySettings = await storage.getDeliverySettings();
      const minOrderAmount = deliverySettings[0]?.minOrderAmount || 100;

      // Get all orders and filter by user's phone number
      const allOrders = await storage.getAllOrders();
      const userOrders = allOrders.filter(order =>
        order.phone === user.phone || order.userId === userId
      ).map(order => ({
        ...order,
        isBelowDeliveryMinimum: order.subtotal < minOrderAmount
      }));

      console.log("GET /api/user/orders - Found", userOrders.length, "orders");
      res.json(userOrders);
    } catch (error: any) {
      console.error("Error fetching user orders:", error);
      res.status(500).json({ message: error.message || "Failed to fetch orders" });
    }
  });

  // Get all categories
  app.get("/api/categories", async (_req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Get all products
  app.get("/api/products", async (req, res) => {
    try {
      const categoryId = req.query.categoryId as string | undefined;

      if (categoryId) {
        const products = await storage.getProductsByCategoryId(categoryId);
        res.json(products);
      } else {
        const products = await storage.getAllProducts();
        res.json(products);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Get a single product by ID
  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProductById(req.params.id);
      if (!product) {
        res.status(404).json({ message: "Product not found" });
        return;
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // Create an order (no authentication required - supports guest checkout)
  // Create an order (no authentication required - supports guest checkout)
app.post("/api/orders", async (req: any, res) => {
  try {
    console.log(" Incoming order body:", JSON.stringify(req.body, null, 2));

    // 🔹 Sanitize request before validation
    const body = req.body;

    const sanitizeNumber = (val: any) =>
      typeof val === "string" ? parseFloat(val) : val;

    const sanitized = {
      customerName: body.customerName?.trim(),
      phone: body.phone?.trim(),
      email: body.email || "",
      address: body.address?.trim(),
      items: Array.isArray(body.items)
  ? body.items.map((i: any) => ({
      id: i.id,
      name: i.name,
      price: sanitizeNumber(i.price),
      quantity: sanitizeNumber(i.quantity),
    }))
  : [],
      subtotal: sanitizeNumber(body.subtotal),
      deliveryFee: sanitizeNumber(body.deliveryFee),
      total: sanitizeNumber(body.total),
      chefId: body.chefId || body.items?.[0]?.chefId || "",
      paymentStatus: body.paymentStatus || "pending",
      userId: body.userId || undefined,
      couponCode: body.couponCode || undefined,
      discount: body.discount || 0,
      walletAmountUsed: sanitizeNumber(body.walletAmountUsed) || 0,
      categoryId: body.categoryId || undefined,
      categoryName: body.categoryName || undefined,
      deliveryTime: body.deliveryTime || undefined,
      deliverySlotId: body.deliverySlotId || undefined,
    };

    // Roti category validation - strict enforcement
    const isRotiCategory = sanitized.categoryName?.toLowerCase() === 'roti' || 
                           sanitized.categoryName?.toLowerCase().includes('roti');
    
    // 🔒 ENFORCE: Delivery fee MUST be greater than 0
    // This ensures user has provided either:
    // 1. Valid customer location (geolocation coordinates)
    // 2. Valid customer address
    // Without at least one of these, delivery cannot be calculated/validated
    if (sanitized.deliveryFee <= 0) {
      console.log(`🚫 Order blocked - deliveryFee is ₹${sanitized.deliveryFee} (location/address required)`);
      return res.status(400).json({
        message: "Valid delivery location required to place order. Please provide either your location or delivery address.",
        requiresLocation: true,
        deliveryFeeInvalid: true,
        currentDeliveryFee: sanitized.deliveryFee,
      });
    }

    // 🔒 CRITICAL: Validate DELIVERY ADDRESS is in service zone (NOT customer GPS location)
    // Address-based validation ensures orders can only be delivered to Kurla West area
    const customerLatitude = sanitizeNumber(body.customerLatitude);
    const customerLongitude = sanitizeNumber(body.customerLongitude);
    
    // We must have ADDRESS coordinates to validate delivery zone
    if (customerLatitude === undefined || customerLongitude === undefined || isNaN(customerLatitude) || isNaN(customerLongitude)) {
      console.log(`🚫 Order blocked - no delivery coordinates provided`);
      return res.status(400).json({
        message: "Delivery address coordinates required. Please enter and confirm your delivery address.",
        requiresAddressValidation: true,
      });
    }

    // Calculate distance from CHEF'S LOCATION to DELIVERY ADDRESS
    const { calculateDistance } = await import("@shared/deliveryUtils");
    
    // Get chef's location from database (if no chefId, use Kurla West default)
    let chefLat = 19.0728;
    let chefLon = 72.8826;
    let chefName = "Kurla West Kitchen";
    
    if (sanitized.chefId) {
      const chef = await db.query.chefs.findFirst({ 
        where: (c: any, { eq }: any) => eq(c.id, sanitized.chefId) 
      });
      if (chef) {
        chefLat = chef.latitude ?? 19.0728;
        chefLon = chef.longitude ?? 72.8826;
        chefName = chef.name;
      }
    }
    
    const MAX_DELIVERY_DISTANCE_KM = 2.5; // 2.5km delivery zone from chef location
    
    const addressDistance = calculateDistance(chefLat, chefLon, customerLatitude, customerLongitude);
    
    console.log(`[DELIVERY-ZONE] Validating delivery address:`, {
      address: sanitized.address,
      latitude: customerLatitude,
      longitude: customerLongitude,
      chefName: chefName,
      chefLocation: `${chefLat.toFixed(4)}, ${chefLon.toFixed(4)}`,
      distanceFromChef: addressDistance.toFixed(2),
      maxDistance: MAX_DELIVERY_DISTANCE_KM,
    });

    if (addressDistance > MAX_DELIVERY_DISTANCE_KM) {
      console.log(`🚫 Order blocked - delivery address outside service zone:`, {
        address: sanitized.address,
        chef: chefName,
        distanceFromChef: addressDistance.toFixed(2),
        maxDistance: MAX_DELIVERY_DISTANCE_KM,
      });
      return res.status(400).json({
        message: `Delivery not available to this address. ${chefName} delivers within ${MAX_DELIVERY_DISTANCE_KM}km. This address is ${addressDistance.toFixed(1)}km away.`,
        outsideDeliveryZone: true,
        addressDistance: addressDistance.toFixed(1),
        maxDistance: MAX_DELIVERY_DISTANCE_KM,
        address: sanitized.address,
      });
    } else {
      console.log(`✅ Delivery address validated successfully:`, {
        address: sanitized.address,
        chef: chefName,
        distanceFromChef: addressDistance.toFixed(2),
        withinZone: true,
      });
    }
    
    if (isRotiCategory) {
      // Get roti settings
      const rotiSettings = await storage.getRotiSettings();
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinutes = now.getMinutes();
      
      if (rotiSettings?.isActive) {
        // Parse morning block window
        const [blockStartH, blockStartM] = rotiSettings.morningBlockStartTime.split(':').map(Number);
        const [blockEndH, blockEndM] = rotiSettings.morningBlockEndTime.split(':').map(Number);
        
        const blockStartMinutes = blockStartH * 60 + blockStartM;
        const blockEndMinutes = blockEndH * 60 + blockEndM;
        const currentTimeMinutes = currentHour * 60 + currentMinutes;
        
        // STRICTLY BLOCK orders during morning window (8 AM - 11 AM by default)
        if (currentTimeMinutes >= blockStartMinutes && currentTimeMinutes < blockEndMinutes) {
          console.log(`🚫 Roti order blocked - current time ${currentHour}:${currentMinutes} is within morning restriction`);
          return res.status(403).json({
            message: rotiSettings.blockMessage || "Roti orders are not available from 8 AM to 11 AM. Please order before 11 PM for next morning delivery.",
            morningRestriction: true,
            isBlocked: true,
            blockStartTime: rotiSettings.morningBlockStartTime,
            blockEndTime: rotiSettings.morningBlockEndTime,
            currentTime: `${currentHour.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`,
          });
        }
      }
      
      // If slot provided, validate it and enforce next-day logic
      if (sanitized.deliverySlotId) {
        const slot = await storage.getDeliveryTimeSlot(sanitized.deliverySlotId);
        if (!slot) {
          return res.status(400).json({ message: "Selected delivery slot not found" });
        }
        const cutoffInfo = computeSlotCutoffInfo(slot);
        
        // PREVENT selecting morning slot during morning restriction hours
        if (cutoffInfo.inMorningRestriction && cutoffInfo.isMorningSlot) {
          console.log(`🚫 Morning slot selection blocked during morning hours`);
          return res.status(403).json({
            message: "Morning delivery slots (8 AM - 11 AM) cannot be selected during morning hours. Please order by 11 PM the previous day or select a later time slot.",
            morningRestriction: true,
            isBlocked: true,
            availableAfter: rotiSettings?.morningBlockEndTime || "11:00",
            suggestLaterSlot: true,
          });
        }
        
        // Auto next-day scheduling notification
        if (cutoffInfo.isPastCutoff) {
          console.log(`📅 Auto-scheduling Roti order for next day - slot cutoff passed`);
        }
      } else {
        // NO SLOT SELECTED - Do NOT set deliveryTime
        // Order should be treated as a regular order, NOT scheduled
        console.log(`⏰ No slot selected: Order will be treated as regular order (not scheduled)`);
      }
    }

    // Remove undefined deliveryTime and deliverySlotId from sanitized object
    // This ensures they're treated as optional and not validated against
    if (sanitized.deliveryTime === undefined) {
      delete (sanitized as any).deliveryTime;
    }
    if (sanitized.deliverySlotId === undefined) {
      delete (sanitized as any).deliverySlotId;
    }

      const result = insertOrderSchema.safeParse(sanitized);
      if (!result.success) {
        console.error("❌ Order validation failed:", result.error.flatten());
        return res.status(400).json({
          message: "Invalid order data",
          errors: result.error.flatten(),
          received: sanitized,
        });
      }

      // Extract authenticated userId (JWT) or auto-register new user
      let userId: string | undefined;
      let accountCreated = false;
      let generatedPassword: string | undefined;
      let emailSent = false;
      let appliedReferralBonus = 0;
      const referralCodeInput = (req.body as any).referralCode;    if (req.headers.authorization?.startsWith("Bearer ")) {
      const token = req.headers.authorization.substring(7);
      const payload = verifyUserToken(token);
      if (payload?.userId) userId = payload.userId;
    } else if (sanitized.phone) {
      // Auto-register user if phone is provided and user doesn't exist
      // Phone is the PRIMARY identifier (unique per account)
      let user = await storage.getUserByPhone(sanitized.phone);

      if (!user) {
        // NEW PHONE = Create new account
        // Email can be reused across different phone numbers
        accountCreated = true;
        const tempPassword = sanitized.phone.slice(-6);
        generatedPassword = tempPassword;
        const passwordHash = await hashPassword(tempPassword);
        
        try {
          user = await storage.createUser({
            name: sanitized.customerName,
            phone: sanitized.phone,
            email: sanitized.email || null,
            address: sanitized.address || null,
            passwordHash,
            referralCode: null,
            walletBalance: 0,
          });
          console.log(`✅ New account created with phone: ${sanitized.phone}, Email: ${sanitized.email || 'Not provided'}`);

          // Apply referral code if provided (new user only)
          if (referralCodeInput && user.id) {
            try {
              await storage.applyReferralBonus(referralCodeInput.trim().toUpperCase(), user.id);
              console.log(`✅ Referral code ${referralCodeInput} applied to new user ${user.id}`);
              
              // Get the bonus amount from wallet transactions
              const transactions = await storage.getWalletTransactions(user.id, 1);
              const referralTransaction = transactions.find(t => t.type === 'referral_bonus');
              if (referralTransaction) {
                appliedReferralBonus = referralTransaction.amount;
              }
            } catch (referralError: any) {
              console.warn(`⚠️ Failed to apply referral code: ${referralError.message}`);
              // Don't fail the order if referral fails - it's optional
            }
          }

          // Send welcome email if provided
          if (sanitized.email && generatedPassword) {
            const emailHtml = createWelcomeEmail(sanitized.customerName, sanitized.phone, generatedPassword);
            emailSent = await sendEmail({
              to: sanitized.email,
              subject: '🍽️ Welcome to RotiHai - Your Account Details',
              html: emailHtml,
            });

            if (emailSent) {
              console.log(`✅ Welcome email sent to ${sanitized.email}`);
            }
          }
        } catch (createUserError: any) {
          console.error("Error creating user:", createUserError);
          throw createUserError;
        }
      } else {
        // EXISTING PHONE = Use existing account
        console.log(`✅ Existing account found with phone: ${sanitized.phone}`);
        await storage.updateUserLastLogin(user.id);
      }

      if (user) {
        userId = user.id;
      } else {
        throw new Error("Failed to create or find user account");
      }
    }

    // Build payload to create order
    const orderPayload: any = {
      ...result.data,
      paymentStatus: "pending",
      userId,
    };

    console.log("📦 Creating order with userId:", userId, "accountCreated:", accountCreated);

    // Determine chefId if missing
    if (!orderPayload.chefId && orderPayload.items.length > 0) {
      const firstProduct = await storage.getProductById(orderPayload.items[0].id);
      orderPayload.chefId = firstProduct?.chefId ?? undefined;
    }

    if (!orderPayload.chefId) {
      return res
        .status(400)
        .json({ message: "Unable to determine chefId for the order" });
    }

    // Get chef name and add to order
    const chef = await storage.getChefById(orderPayload.chefId);
    if (chef) {
      orderPayload.chefName = chef.name;
    }

    // Enrich items with hotelPrice (partner's cost price) from products table
    orderPayload.items = await Promise.all(
      orderPayload.items.map(async (item: any) => {
        const product = await storage.getProductById(item.id);
        return {
          ...item,
          hotelPrice: product?.hotelPrice || 0, // Add partner's cost price to order item
        };
      })
    );

    // Calculate and set deliveryDate if deliverySlotId is provided
    if (orderPayload.deliverySlotId) {
      try {
        const slot = await storage.getDeliveryTimeSlot(orderPayload.deliverySlotId);
        if (slot) {
          const cutoffInfo = computeSlotCutoffInfo(slot);
          // Format date as YYYY-MM-DD
          const deliveryDate = cutoffInfo.nextAvailableDate;
          const year = deliveryDate.getFullYear();
          const month = String(deliveryDate.getMonth() + 1).padStart(2, '0');
          const day = String(deliveryDate.getDate()).padStart(2, '0');
          orderPayload.deliveryDate = `${year}-${month}-${day}`;
          console.log(`📅 Set deliveryDate to: ${orderPayload.deliveryDate}`);
        }
      } catch (error) {
        console.warn("Error calculating deliveryDate:", error);
      }
    }

    console.log("📝 Order payload before DB insert:", JSON.stringify(orderPayload, null, 2));
    const order = await storage.createOrder(orderPayload);
    console.log("✅ Order created successfully:", order.id);
    console.log(`📋 Order Details: userId=${userId}, walletAmountUsed=${order.walletAmountUsed}`);

      // Record coupon usage with per-user tracking
      if (orderPayload.couponCode && userId) {
        await storage.recordCouponUsage(orderPayload.couponCode, userId, order.id);
      } else if (orderPayload.couponCode) {
        await storage.incrementCouponUsage(orderPayload.couponCode);
      }

      // Complete referral bonus if this is user's first order
      if (userId) {
        const { db: database } = await import("@shared/db");
        const { referrals: referralsTable } = await import("@shared/db");
        const { eq, and } = await import("drizzle-orm");

        const pendingReferral = await database.query.referrals.findFirst({
          where: (r, { eq, and }) => and(
            eq(r.referredId, userId),
            eq(r.status, "pending")
          ),
        });

        if (pendingReferral) {
          // Execute referral completion in a database transaction
          await database.transaction(async (tx) => {
            // Get referred user info using transaction client
            const referredUser = await tx.query.users.findFirst({
              where: (u, { eq }) => eq(u.id, userId),
            });

            // Mark referral as completed
            await tx.update(referralsTable)
              .set({
                status: "completed",
                referredOrderCompleted: true,
                completedAt: new Date()
              })
              .where(eq(referralsTable.id, pendingReferral.id));

            // Add bonus to referrer's wallet with proper wallet transaction
            await storage.createWalletTransaction({
              userId: pendingReferral.referrerId,
              amount: pendingReferral.referrerBonus,
              type: "referral_bonus",
              description: `Referral bonus: ${referredUser?.name || 'User'} completed their first order using your code`,
              referenceId: pendingReferral.id,
              referenceType: "referral",
            }, tx);
          });
        }
      }

    // 📱 Send WhatsApp notification to admin about new order (non-blocking)
    try {
      // For now, using a default admin phone - in production, fetch from admin settings
      // TODO: Update this to fetch actual admin phone from database settings
      const adminPhone = process.env.ADMIN_PHONE_NUMBER;
      await sendOrderPlacedAdminNotification(
        order.id,
        order.customerName,
        order.total,
        adminPhone
      );
    } catch (notificationError) {
      console.error("⚠️ Error sending admin WhatsApp notification (non-critical):", notificationError);
      // Don't fail the order creation if notification fails
    }

    broadcastNewOrder(order);

    console.log("✅ Order created successfully:", order.id);

    // Generate access token for newly created users
    let accessToken: string | undefined;
    if (accountCreated && userId) {
      const user = await storage.getUser(userId);
      if (user) {
        accessToken = generateAccessToken(user);
      }
    }

    res.status(201).json({
      ...order,
      accountCreated,
      defaultPassword: accountCreated ? generatedPassword : undefined,
      emailSent: accountCreated ? emailSent : undefined,
      accessToken: accountCreated ? accessToken : undefined,
      appliedReferralBonus: appliedReferralBonus > 0 ? appliedReferralBonus : undefined,
    });
  } catch (error: any) {
    console.error("❌ Create order error:", error);
    res.status(500).json({ message: error.message || "Failed to create order" });
  }
});


  // Get user's orders (supports both authenticated users and phone-based lookup)
  app.get("/api/orders", async (req: any, res) => {
    try {
      console.log("GET /api/orders - Auth header:", req.headers.authorization ? "Present" : "Missing");
      console.log("GET /api/orders - Query params:", req.query);

      // Check if user is authenticated via Replit auth
      if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims?.sub) {
        const userId = req.user.claims.sub;
        const user = await storage.getUser(userId);
        if (!user) {
          res.status(404).json({ message: "User not found" });
          return;
        }

        const allOrders = await storage.getAllOrders();
        const userOrders = allOrders.filter(order =>
          order.email === user.email || order.phone === user.email
        );
        res.json(userOrders);
      }
      // Check if user is authenticated via phone auth (JWT)
      else if (req.headers.authorization?.startsWith("Bearer ")) {
        const token = req.headers.authorization.substring(7);
        const { verifyToken } = await import("./userAuth");
        const payload = verifyToken(token);

        if (payload) {
          console.log("GET /api/orders - Valid token for user:", payload.userId);
          const orders = await storage.getOrdersByUserId(payload.userId);
          res.json(orders);
        } else {
          console.log("GET /api/orders - Invalid token");
          res.status(401).json({ message: "Invalid token" });
        }
      }
      // Allow query by phone for guest users
      else if (req.query.phone) {
        const allOrders = await storage.getAllOrders();
        const userOrders = allOrders.filter(order => order.phone === req.query.phone);
        res.json(userOrders);
      }
      else {
        console.log("GET /api/orders - No valid authentication method found");
        res.status(401).json({ message: "Authentication required or provide phone number" });
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Get order by ID
  app.get("/api/orders/:id", async (req, res) => {
    try {
      const { id } = req.params;

      // Allow unauthenticated access for order tracking (users receive order ID after placing order)
      const order = await storage.getOrderById(id);

      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }

      res.json(order);
    } catch (error: any) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Confirm payment manually by user
  app.post("/api/orders/:id/payment-confirmed", async (req, res) => {
    try {
      const { id } = req.params;

      const order = await storage.getOrderById(id);
      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }

      let accessToken: string | undefined;
      let refreshToken: string | undefined;
      let userCreated = false;

      // Check if order userId is null (new user) - create account on payment confirmation
      if (!order.userId) {
        console.log(`📝 Payment confirmed for new user order ${id} - Creating user account`);
        
        let user = await storage.getUserByPhone(order.phone);
        
        if (!user) {
          // Create new user account with default password (last 6 digits of phone)
          const generatedPassword = order.phone.slice(-6);
          const passwordHash = await hashPassword(generatedPassword);
          
          user = await storage.createUser({
            name: order.customerName,
            phone: order.phone,
            email: order.email || null,
            address: order.address || null,
            passwordHash,
            referralCode: null,
            walletBalance: 0,
          });
          
          console.log(`✅ New user created on payment confirmation: ${user.id} - Phone: ${order.phone}`);
          userCreated = true;
          
          // Send welcome email if email provided
          if (order.email) {
            const emailHtml = createWelcomeEmail(order.customerName, order.phone, generatedPassword);
            const emailSent = await sendEmail({
              to: order.email,
              subject: '🍽️ Welcome to RotiHai - Your Account Details',
              html: emailHtml,
            });
            
            if (emailSent) {
              console.log(`✅ Welcome email sent to ${order.email}`);
            }
          }
          
          // Update order with new userId
          await db.update(orders).set({ userId: user.id }).where(eq(orders.id, id));
          order.userId = user.id;
          
          // Generate tokens for immediate login
          accessToken = generateAccessToken(user);
          refreshToken = generateRefreshToken(user);
        } else {
          console.log(`👤 User already exists with phone ${order.phone}, linking to order`);
          // Link existing user to order
          await db.update(orders).set({ userId: user.id }).where(eq(orders.id, id));
          order.userId = user.id;
          
          // Generate tokens for login
          accessToken = generateAccessToken(user);
          refreshToken = generateRefreshToken(user);
        }
      }

      // Check if order was already paid (for idempotency)
      const orderBefore = await storage.getOrderById(id);
      const isIdempotentCall = orderBefore?.paymentStatus === "paid";
      
      if (isIdempotentCall) {
        console.log(`⏭️ Order ${id} already marked as paid. Skipping payment processing...`);
        // Still return the order to client, but don't process again
        res.json({
          message: "Payment already confirmed for this order",
          order: orderBefore,
        });
        return;
      }

      // Update order payment status to indicate user confirmed payment
      const updatedOrder = await storage.updateOrderPaymentStatus(id, "paid");

      console.log(`✅ Payment confirmed for order ${id} - Status: ${updatedOrder?.paymentStatus}`);

      // 💳 DEDUCT WALLET BALANCE when payment is confirmed (only once)
      if (updatedOrder && updatedOrder.walletAmountUsed && updatedOrder.walletAmountUsed > 0 && updatedOrder.userId) {
        console.log(`\n💳 [=${'='.repeat(50)}] WALLET DEDUCTION TRACE [${'='.repeat(50)}]`);
        console.log(`💳 [WALLET] Processing wallet deduction for order ${id}...`);
        console.log(`💳 [WALLET] Order walletAmountUsed value: ₹${updatedOrder.walletAmountUsed}`);
        console.log(`💳 [WALLET] Order walletAmountUsed type: ${typeof updatedOrder.walletAmountUsed}`);
        
        // Get current wallet balance before deduction
        const userBefore = await storage.getUser(updatedOrder.userId);
        const balanceBefore = userBefore?.walletBalance || 0;
        console.log(`💳 [WALLET] User ID: ${updatedOrder.userId}`);
        console.log(`💳 [WALLET] STEP 1 - Query user balance BEFORE deduction:`);
        console.log(`💳 [WALLET]   → Returned walletBalance: ${userBefore?.walletBalance}`);
        console.log(`💳 [WALLET]   → Actual balanceBefore used: ₹${balanceBefore}`);
        
        // Check if wallet has already been deducted for this order (double-check)
        const existingTransactions = await storage.getWalletTransactions(updatedOrder.userId, 100);
        const deductionTransactions = existingTransactions.filter(
          (txn: any) => txn.referenceId === id && txn.type === "debit"
        );
        
        if (deductionTransactions.length > 0) {
          console.log(`⏭️ [WALLET] Found ${deductionTransactions.length} existing debit transaction(s) for order ${id}. Skipping...`);
          const existingAmount = deductionTransactions.reduce((sum: number, txn: any) => sum + txn.amount, 0);
          console.log(`   Already deducted: ₹${existingAmount}`);
        } else {
          console.log(`💳 [WALLET] No existing transaction found. Proceeding with deduction...`);
          try {
            // Create wallet transaction for audit trail (this also updates the wallet balance atomically)
            await storage.createWalletTransaction({
              userId: updatedOrder.userId,
              amount: updatedOrder.walletAmountUsed,
              type: "debit",
              description: `Wallet payment for order #${updatedOrder.id}`,
              referenceId: updatedOrder.id,
              referenceType: "order",
            });
            console.log(`✅ [WALLET] Balance updated and transaction logged`);
            
            // Get updated wallet balance
            const updatedUser = await storage.getUser(updatedOrder.userId);
            const newWalletBalance = updatedUser?.walletBalance || 0;
            console.log(`   User wallet balance AFTER: ₹${newWalletBalance}`);
            console.log(`   Calculation: ₹${balanceBefore} - ₹${updatedOrder.walletAmountUsed} = ₹${newWalletBalance}`);
            
            // 📣 Broadcast wallet update to customer in real-time
            broadcastWalletUpdate(updatedOrder.userId, newWalletBalance);
            console.log(`✅ [WALLET] Broadcast sent to user ${updatedOrder.userId}`);
            
            console.log(`✅ [WALLET] COMPLETE: ₹${updatedOrder.walletAmountUsed} deducted from wallet for order #${updatedOrder.id}`);
            console.log(`💳 [${'='.repeat(100)}]\n`);
          } catch (walletError: any) {
            console.error("❌ [WALLET] ERROR during deduction:", walletError.message);
            console.error(walletError.stack);
            // Don't fail the payment confirmation if wallet deduction fails - it's non-critical
          }
        }
      } else {
        console.log(`⏭️ [WALLET] Skipped deduction: walletAmountUsed=${updatedOrder?.walletAmountUsed}, userId=${updatedOrder?.userId}`);
      }

      const response: any = {
        message: "Payment confirmation received",
        order: updatedOrder,
      };

      // Include tokens and user info if new account was created
      if (userCreated) {
        response.userCreated = true;
        response.accessToken = accessToken;
        response.refreshToken = refreshToken;
      }

      res.json(response);
    } catch (error: any) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ message: error.message || "Failed to confirm payment" });
    }
  });

  // Get all chefs
  app.get("/api/chefs", async (_req, res) => {
    try {
      const chefs = await storage.getChefs();
      res.json(chefs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chefs" });
    }
  });

  // Get specific chef by ID
  app.get("/api/chefs/:chefId", async (req, res) => {
    try {
      const { chefId } = req.params;
      
      // Prevent matching with category endpoint - check if it looks like a chef ID
      // Chef IDs typically contain "chef" or are nanoid/uuid format
      // Category IDs are like "cat-roti", "cat-lunch" etc.
      if (!chefId || chefId.startsWith('cat-')) {
        // This looks like a category ID, not a chef ID
        const chefs = await storage.getChefsByCategory(chefId);
        return res.json(chefs);
      }
      
      const chef = await storage.getChefById(chefId);
      if (!chef) {
        return res.status(404).json({ message: "Chef not found" });
      }
      res.json(chef);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chef" });
    }
  });

  // Calculate delivery fee based on distance (using admin settings)
  app.post("/api/calculate-delivery", async (req, res) => {
    try {
      const { latitude, longitude, chefId, subtotal = 0 } = req.body;

      if (!latitude || !longitude) {
        res.status(400).json({ message: "Latitude and longitude are required" });
        return;
      }

      // Get chef location or default to Kurla West, Mumbai
      let chefLat: number = 19.0728;
      let chefLon: number = 72.8826;

      if (chefId) {
        const chef = await storage.getChefById(chefId);
        if (chef && chef.latitude !== null && chef.longitude !== null &&
            chef.latitude !== undefined && chef.longitude !== undefined) {
          chefLat = chef.latitude;
          chefLon = chef.longitude;
        }
      }

      // Import delivery utilities
      const { calculateDistance, calculateDelivery } = await import("@shared/deliveryUtils");

      // Calculate distance
      const distance = calculateDistance(latitude, longitude, chefLat, chefLon);

      // Get admin delivery settings
      const deliverySettingsRaw = await storage.getDeliverySettings();

      // Map null minOrderAmount to undefined for type compatibility
      const deliverySettings = deliverySettingsRaw.map(setting => ({
        ...setting,
        minOrderAmount: setting.minOrderAmount ?? undefined
      }));

      // Calculate delivery fee using admin settings
      const deliveryCalc = calculateDelivery(distance, subtotal, deliverySettings);

      res.json({
        distance,
        deliveryFee: deliveryCalc.deliveryFee,
        deliveryRangeName: deliveryCalc.deliveryRangeName,
        freeDeliveryEligible: deliveryCalc.freeDeliveryEligible,
        amountForFreeDelivery: deliveryCalc.amountForFreeDelivery,
        estimatedTime: Math.ceil(distance * 2 + 15)
      });
    } catch (error) {
      console.error("Error calculating delivery:", error);
      res.status(500).json({ message: "Failed to calculate delivery" });
    }
  });

  // Get all subscription plans (public access)
  app.get("/api/subscription-plans", async (_req, res) => {
    try {
      const plans = await storage.getSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      res.status(500).json({ message: "Failed to fetch subscription plans" });
    }
  });

  // Public route to fetch active promotional banners
  app.get("/api/promotional-banners", async (_req, res) => {
    try {
      const banners = await storage.getActivePromotionalBanners();
      res.json(banners);
    } catch (error) {
      console.error("Error fetching promotional banners:", error);
      res.status(500).json({ message: "Failed to fetch promotional banners" });
    }
  });

  // Public subscription endpoint - allows subscribing without login (auto-creates user account)
  app.post("/api/subscriptions/public", async (req, res) => {
    try {
      const { 
        customerName, 
        phone, 
        email, 
        address, 
        planId, 
        deliveryTime = "09:00", 
        deliverySlotId, 
        durationDays = 30 
      } = req.body;

      // Validate required fields
      if (!customerName || !phone) {
        res.status(400).json({ message: "Customer name and phone are required" });
        return;
      }

      if (!planId) {
        res.status(400).json({ message: "Plan ID is required" });
        return;
      }

      // Validate phone format (10 digits)
      const sanitizedPhone = phone.trim().replace(/\s+/g, '');
      if (!/^\d{10}$/.test(sanitizedPhone)) {
        res.status(400).json({ message: "Valid 10-digit phone number is required" });
        return;
      }

      const plan = await storage.getSubscriptionPlan(planId);
      if (!plan) {
        res.status(404).json({ message: "Subscription plan not found" });
        return;
      }

      // Get category to check if it's Roti
      const category = await storage.getCategoryById(plan.categoryId);
      const isRotiCategory = category?.name?.toLowerCase() === 'roti' || 
                             category?.name?.toLowerCase().includes('roti');

      // Validate: If subscription is for Roti category, deliverySlotId is required
      if (isRotiCategory && !deliverySlotId) {
        res.status(400).json({
          message: "Delivery time slot is required for Roti category subscriptions",
          requiresDeliverySlot: true,
          categoryName: category?.name
        });
        return;
      }

      // If Roti subscription and slot provided, validate cutoff similar to single orders
      if (isRotiCategory && deliverySlotId) {
        const slot = await storage.getDeliveryTimeSlot(deliverySlotId);
        if (!slot) {
          res.status(400).json({ message: "Selected delivery slot not found" });
          return;
        }
        const cutoffInfo = computeSlotCutoffInfo(slot);
        if (cutoffInfo.isPastCutoff) {
          res.status(400).json({
            message: "Selected delivery slot missed the ordering cutoff for the upcoming delivery. Please schedule the subscription to start from the next available date.",
            requiresReschedule: true,
            nextAvailableDate: cutoffInfo.nextAvailableDate.toISOString(),
            cutoffHoursBefore: cutoffInfo.cutoffHoursBefore,
          });
          return;
        }
      }

      // Check if user exists, if not create one
      let user = await storage.getUserByPhone(sanitizedPhone);
      let isNewUser = false;
      let generatedPassword: string | undefined;
      let emailSent = false;

      if (!user) {
        isNewUser = true;
        // Phone is PRIMARY identifier - create new account even if email exists
        const newPassword = sanitizedPhone.slice(-6);
        generatedPassword = newPassword;
        const passwordHash = await hashPassword(newPassword);
        
        try {
          user = await storage.createUser({
            name: customerName.trim(),
            phone: sanitizedPhone,
            email: email ? email.trim().toLowerCase() : null,
            address: address ? address.trim() : null,
            passwordHash,
            referralCode: null,
            walletBalance: 0,
          });

          console.log(`✅ New account created during subscription with phone: ${sanitizedPhone}, Email: ${email || 'Not provided'}`);

          // Send welcome email if provided
          if (email) {
            const emailHtml = createWelcomeEmail(customerName, sanitizedPhone, newPassword);
            emailSent = await sendEmail({
              to: email,
              subject: '🍽️ Welcome to RotiHai - Your Account Details',
              html: emailHtml,
            });

            if (emailSent) {
              console.log(`✅ Welcome email sent to ${email}`);
            }
          }
        } catch (createUserError: any) {
          console.error("Error creating user during subscription:", createUserError);
          throw createUserError;
        }
      } else {
        console.log(`✅ Existing account found with phone: ${sanitizedPhone}`);
        await storage.updateUserLastLogin(user.id);
      }

      // Generate tokens for the user
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      // Create the subscription
      const now = new Date();
      let nextDelivery = new Date(now);
      let finalDeliveryTime = deliveryTime; // Start with provided delivery time
      
      // If this is a slot-based subscription, calculate the correct next delivery date AND time
      if (deliverySlotId) {
        const slot = await storage.getDeliveryTimeSlot(deliverySlotId);
        if (slot) {
          const cutoffInfo = computeSlotCutoffInfo(slot);
          nextDelivery = new Date(cutoffInfo.nextAvailableDate);
          finalDeliveryTime = slot.startTime; // Extract time from slot (e.g., "20:00" for 8PM)
          console.log(`📅 Subscription next delivery date set from slot: ${nextDelivery.toISOString()}, time: ${finalDeliveryTime}`);
        } else {
          // Fallback if slot not found
          nextDelivery.setDate(nextDelivery.getDate() + 1);
        }
      } else {
        // Non-slot subscriptions default to tomorrow
        nextDelivery.setDate(nextDelivery.getDate() + 1);
      }

      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + durationDays);

      // Calculate total deliveries based on frequency and duration
      const deliveryDays = plan.deliveryDays as string[];
      let totalDeliveries = 0;

      if (plan.frequency === "daily") {
        totalDeliveries = deliveryDays.length > 0 ? Math.floor(durationDays / 7) * deliveryDays.length : durationDays;
      } else if (plan.frequency === "weekly") {
        totalDeliveries = Math.floor(durationDays / 7);
      } else {
        totalDeliveries = Math.floor(durationDays / 30);
      }

      const subscriptionData: any = {
        userId: user.id,
        planId,
        chefId: null,
        chefAssignedAt: null,
        deliverySlotId: deliverySlotId || null,
        customerName: user.name || customerName.trim(),
        phone: user.phone || sanitizedPhone,
        email: user.email || (email ? email.trim().toLowerCase() : null),
        address: user.address || (address ? address.trim() : null),
        status: "pending",
        startDate: now,
        endDate,
        nextDeliveryDate: nextDelivery,
        nextDeliveryTime: finalDeliveryTime,
        customItems: null,
        remainingDeliveries: totalDeliveries,
        totalDeliveries,
        isPaid: false,
        paymentTransactionId: null,
        originalPrice: plan.price,
        discountAmount: 0,
        walletAmountUsed: 0,
        couponCode: null,
        couponDiscount: 0,
        finalAmount: plan.price,
        paymentNotes: null,
        lastDeliveryDate: null,
        deliveryHistory: [],
        pauseStartDate: null,
        pauseResumeDate: null,
      };

      const subscription = await storage.createSubscription(subscriptionData);

      console.log(`✅ Public subscription created: ${subscription.id} for user ${user.id}`);

      // Broadcast new subscription notification to admin
      broadcastNewSubscriptionToAdmin(subscription, plan.name);

      res.status(201).json({
        subscription,
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          address: user.address,
        },
        accessToken,
        refreshToken,
        isNewUser,
        defaultPassword: isNewUser ? generatedPassword : undefined,
        emailSent: isNewUser ? emailSent : undefined,
      });
    } catch (error: any) {
      console.error("Error creating public subscription:", error);
      res.status(500).json({ message: error.message || "Failed to create subscription" });
    }
  });

  // Public helper: check if a user exists by phone (used by guest subscription flow)
  app.get("/api/users/exists", async (req, res) => {
    try {
      const phone = (req.query.phone as string || "").trim().replace(/\s+/g, '');
      if (!phone || !/^\d{10}$/.test(phone)) {
        res.status(400).json({ message: "Valid 10-digit phone query param is required" });
        return;
      }
      const user = await storage.getUserByPhone(phone);
      res.json({ exists: !!user });
    } catch (error: any) {
      console.error("Error checking user existence:", error);
      res.status(500).json({ message: error.message || "Failed to check user" });
    }
  });

  // Helper to safely convert Date to ISO string
  const toISOStringOrNull = (date: any, fieldName: string = "unknown"): string | null => {
    try {
      console.log(`[ISO-CONVERT] Converting ${fieldName}: type=${typeof date}`);
      
      if (!date) {
        console.log(`[ISO-CONVERT] ${fieldName} is null/empty, returning null`);
        return null;
      }
      
      // Handle Date objects
      if (date instanceof Date) {
        // FIRST CHECK: Validate the Date object itself is valid before calling toISOString
        const timeValue = date.getTime();
        console.log(`[ISO-CONVERT] ${fieldName} - getTime(): ${timeValue}, isNaN: ${isNaN(timeValue)}`);
        
        if (isNaN(timeValue)) {
          console.warn(`[ISO-CONVERT] ${fieldName} - INVALID DATE OBJECT (getTime returned NaN), returning null`);
          return null;
        }
        
        // NOW it's safe to call toISOString
        const isoStr = date.toISOString();
        console.log(`[ISO-CONVERT] ${fieldName} - toISOString succeeded: ${isoStr}`);
        
        const parsedDate = new Date(isoStr);
        const year = parsedDate.getFullYear();
        console.log(`[ISO-CONVERT] ${fieldName} - Parsed year: ${year}`);
        
        // CRITICAL: Reject epoch dates (1970) and dates outside acceptable range
        if (year < 1980 || year > 2100) {
          if (year === 1970) {
            console.error(`[ISO-CONVERT] ${fieldName} - EPOCH DATE DETECTED (1970)! This indicates a database issue. Returning null to prevent frontend errors.`);
            console.error(`  Time value: ${timeValue}, ISO: ${isoStr}`);
          } else {
            console.warn(`[ISO-CONVERT] ${fieldName} - INVALID YEAR: ${year}, returning null`);
          }
          return null;
        }
        return isoStr;
      }
      
      // Handle ISO strings
      if (typeof date === 'string') {
        console.log(`[ISO-CONVERT] ${fieldName} is string: "${date}"`);
        const parsed = new Date(date);
        const time = parsed.getTime();
        console.log(`[ISO-CONVERT] ${fieldName} - Parsed string, getTime(): ${time}, year: ${parsed.getFullYear()}`);
        
        if (isNaN(time)) {
          console.warn(`[ISO-CONVERT] ${fieldName} - Invalid date string, returning null`);
          return null;
        }
        
        const year = parsed.getFullYear();
        if (year < 1980 || year > 2100) {
          console.warn(`[ISO-CONVERT] ${fieldName} - Invalid year: ${year}, returning null`);
          return null;
        }
        
        return date;
      }
      
      console.log(`[ISO-CONVERT] ${fieldName} - Unhandled type, returning null`);
      return null;
    } catch (e) {
      console.error(`[ISO-CONVERT] Error converting ${fieldName}: type=${typeof date}, error:`, e);
      return null;
    }
  };

  // Get user's subscriptions
  app.get("/api/subscriptions", requireUser(), async (req: AuthenticatedUserRequest, res) => {
    try {
      const userId = req.authenticatedUser!.userId;
      const allSubscriptions = await storage.getSubscriptions();
      const userSubscriptions = allSubscriptions.filter(s => s.userId === userId);
      
      // Serialize timestamps to ISO strings for proper frontend handling
      const serialized = userSubscriptions.map(s => {
        try {
          console.log(`\n[SERIALIZE-SUB] ===== Starting serialization for ${s.id} =====`);
          const result = {
            ...s,
            startDate: toISOStringOrNull(s.startDate, `${s.id}.startDate`),
            endDate: toISOStringOrNull(s.endDate, `${s.id}.endDate`),
            nextDeliveryDate: toISOStringOrNull(s.nextDeliveryDate, `${s.id}.nextDeliveryDate`),
            lastDeliveryDate: toISOStringOrNull(s.lastDeliveryDate, `${s.id}.lastDeliveryDate`),
            chefAssignedAt: toISOStringOrNull(s.chefAssignedAt, `${s.id}.chefAssignedAt`),
            pauseStartDate: toISOStringOrNull(s.pauseStartDate, `${s.id}.pauseStartDate`),
            pauseResumeDate: toISOStringOrNull(s.pauseResumeDate, `${s.id}.pauseResumeDate`),
            createdAt: toISOStringOrNull(s.createdAt, `${s.id}.createdAt`),
            updatedAt: toISOStringOrNull(s.updatedAt, `${s.id}.updatedAt`),
          };
          console.log(`[SERIALIZE-SUB] Completed serialization for ${s.id}`);
          console.log(`[SERIALIZE-SUB] Final nextDeliveryDate for ${s.id}: ${result.nextDeliveryDate}`);
          return result;
        } catch (e) {
          console.error(`[SERIALIZE-SUB] Error serializing subscription ${s.id}:`, e);
          console.error('Subscription data:', {
            id: s.id,
            startDate: s.startDate,
            endDate: s.endDate,
            nextDeliveryDate: s.nextDeliveryDate,
            lastDeliveryDate: s.lastDeliveryDate,
            chefAssignedAt: s.chefAssignedAt,
            pauseStartDate: s.pauseStartDate,
            pauseResumeDate: s.pauseResumeDate,
            createdAt: s.createdAt,
            updatedAt: s.updatedAt,
          });
          throw e;
        }
      });
      
      console.log(`[SUBSCRIPTIONS] Returning ${serialized.length} subscriptions for user ${userId}`);
      
      // Log each subscription's nextDeliveryDate for debugging
      serialized.forEach((sub: any) => {
        if (sub.nextDeliveryDate === null) {
          console.log(`[SUB-GET] ${sub.id}: nextDeliveryDate is NULL after serialization`);
        } else {
          const date = new Date(sub.nextDeliveryDate);
          const year = date.getFullYear();
          if (year === 1970) {
            console.warn(`[SUB-GET] ${sub.id}: nextDeliveryDate is 1970! Raw value: ${sub.nextDeliveryDate}`);
          } else {
            console.log(`[SUB-GET] ${sub.id}: nextDeliveryDate = ${sub.nextDeliveryDate}, year = ${year}`);
          }
        }
      });
      
      res.json(serialized);
    } catch (error) {
      console.error("Error fetching user subscriptions:", error);
      res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
  });

  // Create a subscription
  app.post("/api/subscriptions", requireUser(), async (req: AuthenticatedUserRequest, res) => {
    try {
      const userId = req.authenticatedUser!.userId;
      const { planId, deliveryTime = "09:00", deliverySlotId, durationDays = 30 } = req.body;

      if (!planId) {
        res.status(400).json({ message: "Plan ID is required" });
        return;
      }

      const plan = await storage.getSubscriptionPlan(planId);
      if (!plan) {
        res.status(404).json({ message: "Subscription plan not found" });
        return;
      }

      // Get category to check if it's Roti
      const category = await storage.getCategoryById(plan.categoryId);
      const isRotiCategory = category?.name?.toLowerCase() === 'roti' || 
                             category?.name?.toLowerCase().includes('roti');

      // Validate: If subscription is for Roti category, deliverySlotId is required
      if (isRotiCategory && !deliverySlotId) {
        res.status(400).json({
          message: "Delivery time slot is required for Roti category subscriptions",
          requiresDeliverySlot: true,
          categoryName: category?.name
        });
        return;
      }

      const user = await storage.getUser(userId);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      const now = new Date();
      let nextDelivery = new Date(now);
      let finalDeliveryTime = deliveryTime; // Start with provided delivery time
      
      console.log(`\n[SUB-CREATE] ===== STARTING SUBSCRIPTION CREATION =====`);
      console.log(`[SUB-CREATE] planId: ${planId}, deliverySlotId: ${deliverySlotId}, deliveryTime: ${deliveryTime}`);
      console.log(`[SUB-CREATE] [1] Initial values - now: ${now.toISOString()}, nextDelivery: ${nextDelivery.toISOString()}`);
      
      // If this is a slot-based subscription, calculate the correct next delivery date AND time
      if (deliverySlotId) {
        console.log(`[SUB-CREATE] [2] Slot ID provided: ${deliverySlotId}`);
        const slot = await storage.getDeliveryTimeSlot(deliverySlotId);
        console.log(`[SUB-CREATE] [3] Slot lookup result: ${slot ? 'FOUND' : 'NOT FOUND'}`);
        if (slot) {
          console.log(`[SUB-CREATE] [4] Slot details - id: ${slot.id}, startTime: ${slot.startTime}`);
          const cutoffInfo = computeSlotCutoffInfo(slot);
          console.log(`[SUB-CREATE] [5] Cutoff info computed - nextAvailableDate: ${cutoffInfo.nextAvailableDate.toISOString()}`);
          nextDelivery = new Date(cutoffInfo.nextAvailableDate);
          finalDeliveryTime = slot.startTime; // Extract time from slot (e.g., "20:00" for 8PM)
          console.log(`[SUB-CREATE] [6] Setting nextDelivery from slot - ${nextDelivery.toISOString()}, finalDeliveryTime: ${finalDeliveryTime}`);
          console.log(`📅 Subscription next delivery date set from slot: ${nextDelivery.toISOString()}, time: ${finalDeliveryTime}`);
        } else {
          // Fallback if slot not found
          console.log(`[SUB-CREATE] [4B] Slot not found, using fallback - adding 1 day`);
          nextDelivery.setDate(nextDelivery.getDate() + 1);
          console.log(`[SUB-CREATE] [5B] After fallback - nextDelivery: ${nextDelivery.toISOString()}`);
        }
      } else {
        // Non-slot subscriptions default to tomorrow
        console.log(`[SUB-CREATE] [2B] No slot ID, using default - adding 1 day`);
        nextDelivery.setDate(nextDelivery.getDate() + 1);
        console.log(`[SUB-CREATE] [3B] After default - nextDelivery: ${nextDelivery.toISOString()}`);
      }
      
      console.log(`[SUB-CREATE] [7] Final nextDelivery before validation: ${nextDelivery.toISOString()}, year: ${nextDelivery.getFullYear()}, time: ${nextDelivery.getTime()}`);

      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + durationDays);

      // Calculate total deliveries based on frequency and duration
      const deliveryDays = plan.deliveryDays as string[];
      let totalDeliveries = 0;

      if (plan.frequency === "daily") {
        totalDeliveries = deliveryDays.length > 0 ? Math.floor(durationDays / 7) * deliveryDays.length : durationDays;
      } else if (plan.frequency === "weekly") {
        totalDeliveries = Math.floor(durationDays / 7);
      } else {
        totalDeliveries = Math.floor(durationDays / 30);
      }

      // VALIDATION: Ensure nextDelivery is valid before saving
      if (!nextDelivery || isNaN(nextDelivery.getTime())) {
        console.error(`[SUB-CREATE] ERROR: Invalid nextDelivery date!`, { nextDelivery, isoString: nextDelivery?.toISOString?.() });
        res.status(400).json({ message: "Invalid delivery date calculation. Please contact support." });
        return;
      }
      
      const nextDeliveryYear = nextDelivery.getFullYear();
      if (nextDeliveryYear < 1980 || nextDeliveryYear > 2100) {
        console.error(`[SUB-CREATE] ERROR: Invalid year in nextDelivery!`, { nextDelivery: nextDelivery.toISOString(), year: nextDeliveryYear });
        res.status(400).json({ message: "Delivery date is outside valid range. Please try again." });
        return;
      }

      const subscriptionData: any = { // Use a different variable name to avoid conflict
        userId,
        planId,
        chefId: null,
        chefAssignedAt: null,
        deliverySlotId: deliverySlotId || null,
        customerName: user.name || "",
        phone: user.phone || "",
        email: user.email || "",
        address: user.address || "",
        status: "pending", // Start as pending until payment is confirmed
        startDate: now,
        endDate,
        nextDeliveryDate: nextDelivery,
        nextDeliveryTime: finalDeliveryTime,
        customItems: null,
        remainingDeliveries: totalDeliveries,
        totalDeliveries,
        isPaid: false,
        paymentTransactionId: null,
        originalPrice: plan.price,
        discountAmount: 0,
        walletAmountUsed: 0,
        couponCode: null,
        couponDiscount: 0,
        finalAmount: plan.price,
        paymentNotes: null,
        lastDeliveryDate: null,
        deliveryHistory: [],
        pauseStartDate: null,
        pauseResumeDate: null,
      };

      console.log(`[SUB-CREATE] About to save subscription with nextDeliveryDate:`, {
        value: subscriptionData.nextDeliveryDate,
        valueString: String(subscriptionData.nextDeliveryDate),
        isoString: subscriptionData.nextDeliveryDate?.toISOString?.(),
        year: subscriptionData.nextDeliveryDate?.getFullYear?.(),
        time: subscriptionData.nextDeliveryDate?.getTime?.(),
        isDate: subscriptionData.nextDeliveryDate instanceof Date,
      });

      const subscription = await storage.createSubscription(subscriptionData);

      console.log(`[SUB-CREATE] ===== AFTER STORAGE.CREATE =====`);
      console.log(`[SUB-CREATE] Returned subscription nextDeliveryDate:`, {
        value: subscription.nextDeliveryDate,
        type: typeof subscription.nextDeliveryDate,
        valueString: String(subscription.nextDeliveryDate),
        isDate: subscription.nextDeliveryDate instanceof Date,
      });
      
      if (subscription.nextDeliveryDate instanceof Date) {
        const time = subscription.nextDeliveryDate.getTime();
        const year = subscription.nextDeliveryDate.getFullYear();
        console.log(`[SUB-CREATE] As Date object: getTime()=${time}, getFullYear()=${year}, isNaN=${isNaN(time)}`);
        if (!isNaN(time)) {
          console.log(`[SUB-CREATE] toISOString(): ${subscription.nextDeliveryDate.toISOString()}`);
        } else {
          console.log(`[SUB-CREATE] WARNING: getTime() is NaN - INVALID DATE!`);
        }
      } else if (typeof subscription.nextDeliveryDate === 'string') {
        console.log(`[SUB-CREATE] Is string: "${subscription.nextDeliveryDate}"`);
        const parsed = new Date(subscription.nextDeliveryDate);
        console.log(`[SUB-CREATE] Parsed as Date: getTime()=${parsed.getTime()}, getFullYear()=${parsed.getFullYear()}`);
      } else {
        console.log(`[SUB-CREATE] Unknown type: ${typeof subscription.nextDeliveryDate}`);
      }

      console.log(`✅ Subscription created: ${subscription.id}`);

      // Broadcast new subscription notification to admin
      broadcastNewSubscriptionToAdmin(subscription, plan.name);

      res.status(201).json(subscription);
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: error.message || "Failed to create subscription" });
    }
  });

  // Pause a subscription with optional date range
  app.post("/api/subscriptions/:id/pause", requireUser(), async (req: AuthenticatedUserRequest, res) => {
    try {
      const userId = req.authenticatedUser!.userId;
      const subscription = await storage.getSubscription(req.params.id);

      if (!subscription) {
        res.status(404).json({ message: "Subscription not found" });
        return;
      }

      if (subscription.userId !== userId) {
        res.status(403).json({ message: "Unauthorized" });
        return;
      }

      const { pauseStartDate, pauseResumeDate } = req.body;

      // Prepare update data
      const updateData: any = { status: "paused" };

      if (pauseStartDate) {
        updateData.pauseStartDate = new Date(pauseStartDate);
      } else {
        updateData.pauseStartDate = new Date();
      }

      if (pauseResumeDate) {
        updateData.pauseResumeDate = new Date(pauseResumeDate);
      }

      const updated = await storage.updateSubscription(req.params.id, updateData);

      console.log(`⏸️ Subscription ${req.params.id} paused from ${updateData.pauseStartDate} to ${updateData.pauseResumeDate || 'indefinite'}`);

      res.json(updated);
    } catch (error: any) {
      console.error("Error pausing subscription:", error);
      res.status(500).json({ message: error.message || "Failed to pause subscription" });
    }
  });

  // Resume a subscription
  app.post("/api/subscriptions/:id/resume", requireUser(), async (req: AuthenticatedUserRequest, res) => {
    try {
      const userId = req.authenticatedUser!.userId;
      const subscription = await storage.getSubscription(req.params.id);

      if (!subscription) {
        res.status(404).json({ message: "Subscription not found" });
        return;
      }

      if (subscription.userId !== userId) {
        res.status(403).json({ message: "Unauthorized" });
        return;
      }

      const updated = await storage.updateSubscription(req.params.id, { 
        status: "active",
        pauseStartDate: null,
        pauseResumeDate: null
      });

      console.log(`▶️ Subscription ${req.params.id} resumed`);

      res.json(updated);
    } catch (error: any) {
      console.error("Error resuming subscription:", error);
      res.status(500).json({ message: error.message || "Failed to resume subscription" });
    }
  });

  // Update delivery time preference
  app.patch("/api/subscriptions/:id/delivery-time", requireUser(), async (req: AuthenticatedUserRequest, res) => {
    try {
      const userId = req.authenticatedUser!.userId;
      const subscription = await storage.getSubscription(req.params.id);

      if (!subscription) {
        res.status(404).json({ message: "Subscription not found" });
        return;
      }

      if (subscription.userId !== userId) {
        res.status(403).json({ message: "Unauthorized" });
        return;
      }

      const { deliveryTime } = req.body;
      if (!deliveryTime) {
        res.status(400).json({ message: "Delivery time is required" });
        return;
      }

      const updated = await storage.updateSubscription(req.params.id, { 
        nextDeliveryTime: deliveryTime 
      });

      console.log(`🕐 Subscription ${req.params.id} delivery time updated to ${deliveryTime}`);

      res.json(updated);
    } catch (error: any) {
      console.error("Error updating delivery time:", error);
      res.status(500).json({ message: error.message || "Failed to update delivery time" });
    }
  });

  // Get delivery logs for a subscription
  app.get("/api/subscriptions/:id/delivery-logs", requireUser(), async (req: AuthenticatedUserRequest, res) => {
    try {
      const userId = req.authenticatedUser!.userId;
      const subscription = await storage.getSubscription(req.params.id);

      if (!subscription) {
        res.status(404).json({ message: "Subscription not found" });
        return;
      }

      if (subscription.userId !== userId) {
        res.status(403).json({ message: "Unauthorized" });
        return;
      }

      const logs = await storage.getSubscriptionDeliveryLogs(req.params.id);
      res.json(logs);
    } catch (error: any) {
      console.error("Error fetching delivery logs:", error);
      res.status(500).json({ message: error.message || "Failed to fetch delivery logs" });
    }
  });

  // Confirm subscription payment (user confirms after paying via QR)
  // Supports both authenticated users and guest/public subscriptions
  app.post("/api/subscriptions/:id/payment-confirmed", async (req: any, res) => {
    try {
      const { paymentTransactionId } = req.body;

      if (!paymentTransactionId || paymentTransactionId.trim() === "") {
        res.status(400).json({ message: "Payment transaction ID is required" });
        return;
      }

      const subscription = await storage.getSubscription(req.params.id);

      if (!subscription) {
        res.status(404).json({ message: "Subscription not found" });
        return;
      }

      // Optional authentication check - verify if user is logged in
      let userId: string | undefined;
      if (req.headers.authorization?.startsWith("Bearer ")) {
        const token = req.headers.authorization.substring(7);
        const payload = verifyUserToken(token);
        if (payload?.userId) {
          userId = payload.userId;

          // If authenticated, verify the subscription belongs to this user
          if (subscription.userId !== userId) {
            res.status(403).json({ message: "Unauthorized - This subscription belongs to another user" });
            return;
          }
        }
      }

      // For guest users (no auth token), we trust the subscription ID
      // The subscription was just created in the public flow, so it's safe

      if (subscription.isPaid) {
        res.status(400).json({ message: "Subscription already paid" });
        return;
      }

      const updated = await storage.updateSubscription(req.params.id, {
        paymentTransactionId: paymentTransactionId.trim(),
      });

      console.log(`💳 Subscription ${req.params.id} payment confirmed - TxnID: ${paymentTransactionId.trim()}`);

      // Broadcast to admin for verification
      const { broadcastSubscriptionUpdate } = await import("./websocket");
      if (updated) {
        // Broadcast subscription update to notify admin/chef/customer/browser
        broadcastSubscriptionUpdate(updated);

        // Also send a lightweight email to the customer confirming we received their payment submission
        try {
          const customerEmail = updated.email || null;
          if (customerEmail) {
            const emailHtml = `
              <html>
                <body style="font-family: Arial; max-width:600px; margin:auto;">
                  <h2>Payment received — awaiting verification</h2>
                  <p>Hi ${updated.customerName || ''},</p>
                  <p>We received your payment submission for subscription <b>${updated.id}</b>.</p>
                  <p>Transaction ID: <b>${paymentTransactionId.trim()}</b></p>
                  <p>Our admin team will verify the payment shortly and activate your subscription.</p>
                  <p>Thank you for subscribing with RotiHai.</p>
                </body>
              </html>
            `;

            const emailSent = await sendEmail({
              to: customerEmail,
              subject: `Payment received for your subscription ${updated.id}`,
              html: emailHtml,
            });

            console.log(`📧 Payment submission email ${emailSent ? 'sent' : 'skipped'} to customer: ${customerEmail}`);
          }
        } catch (e) {
          console.error('Error sending payment email to customer:', e);
        }

        // Also log admin notification intent for clarity (broadcastSubscriptionUpdate will notify admins)
        console.log(`📣 Payment verification notification queued for admin for subscription ${req.params.id}`);
      }

      res.json({
        message: "Payment confirmation submitted. Admin will verify shortly.",
        subscription: updated
      });
    } catch (error: any) {
      console.error("Error confirming subscription payment:", error);
      res.status(500).json({ 
        message: error.message || "Failed to confirm payment" 
      });
    }
  });

  // Renew subscription (creates a new subscription for the same plan)
  app.post("/api/subscriptions/:id/renew", requireUser(), async (req: AuthenticatedUserRequest, res) => {
    try {
      const userId = req.authenticatedUser!.userId;
      const oldSubscription = await storage.getSubscription(req.params.id);

      if (!oldSubscription) {
        res.status(404).json({ message: "Subscription not found" });
        return;
      }

      if (oldSubscription.userId !== userId) {
        res.status(403).json({ message: "Unauthorized" });
        return;
      }

      const plan = await storage.getSubscriptionPlan(oldSubscription.planId);
      if (!plan) {
        res.status(404).json({ message: "Subscription plan not found" });
        return;
      }

      const user = await storage.getUser(userId);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      const now = new Date();
      let nextDelivery = new Date(now);
      let finalDeliveryTime = oldSubscription.nextDeliveryTime || "09:00"; // Use old time as default
      
      // If this is a slot-based subscription, calculate the correct next delivery date AND time
      if (oldSubscription.deliverySlotId) {
        const slot = await storage.getDeliveryTimeSlot(oldSubscription.deliverySlotId);
        if (slot) {
          const cutoffInfo = computeSlotCutoffInfo(slot);
          nextDelivery = new Date(cutoffInfo.nextAvailableDate);
          finalDeliveryTime = slot.startTime; // Extract time from slot (e.g., "20:00" for 8PM)
          console.log(`📅 Renewed subscription next delivery date set from slot: ${nextDelivery.toISOString()}, time: ${finalDeliveryTime}`);
        } else {
          // Fallback if slot not found
          nextDelivery.setDate(nextDelivery.getDate() + 1);
        }
      } else {
        // Non-slot subscriptions default to tomorrow
        nextDelivery.setDate(nextDelivery.getDate() + 1);
      }

      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + 30);

      const deliveryDays = plan.deliveryDays as string[];
      let totalDeliveries = Math.floor(30 / 7) * deliveryDays.length;

      const newSubscription = await storage.createSubscription({
        userId,
        planId: oldSubscription.planId,
        chefId: oldSubscription.chefId || null,
        chefAssignedAt: null,
        deliverySlotId: oldSubscription.deliverySlotId || null,
        customerName: user.name || "",
        phone: user.phone || "",
        email: user.email || "",
        address: user.address || "",
        status: "pending",
        startDate: now,
        endDate,
        nextDeliveryDate: nextDelivery,
        nextDeliveryTime: finalDeliveryTime,
        customItems: null,
        remainingDeliveries: totalDeliveries,
        totalDeliveries,
        isPaid: false,
        paymentTransactionId: null,
        originalPrice: plan.price,
        discountAmount: 0,
        walletAmountUsed: 0,
        couponCode: null,
        couponDiscount: 0,
        finalAmount: plan.price,
        paymentNotes: null,
        lastDeliveryDate: null,
        deliveryHistory: [],
        pauseStartDate: null,
        pauseResumeDate: null,
      });

      console.log(`🔄 Subscription renewed for user ${userId} - New subscription ID: ${newSubscription.id}`);

      res.status(201).json(newSubscription);
    } catch (error: any) {
      console.error("Error renewing subscription:", error);
      res.status(500).json({ message: error.message || "Failed to renew subscription" });
    }
  });

  // Update delivery time for a subscription
  app.patch("/api/subscriptions/:subscriptionId/delivery-time", requireUser(), async (req: AuthenticatedUserRequest, res) => {
    try {
      const userId = req.authenticatedUser!.userId;
      const { subscriptionId } = req.params;
      const { deliveryTime } = req.body;

      if (!deliveryTime || typeof deliveryTime !== "string") {
        res.status(400).json({ message: "Valid delivery time is required" });
        return;
      }

      // Validate time format (HH:mm)
      if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(deliveryTime)) {
        res.status(400).json({ message: "Invalid time format. Use HH:mm" });
        return;
      }

      const subscription = await storage.getSubscription(subscriptionId);
      if (!subscription) {
        res.status(404).json({ message: "Subscription not found" });
        return;
      }

      if (subscription.userId !== userId) {
        res.status(403).json({ message: "Unauthorized" });
        return;
      }

      const updated = await storage.updateSubscription(subscriptionId, {
        nextDeliveryTime: deliveryTime,
      });

      console.log(`⏰ Updated subscription ${subscriptionId} delivery time to: ${deliveryTime}`);
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating delivery time:", error);
      res.status(500).json({ message: error.message || "Failed to update delivery time" });
    }
  });

  // Get subscription schedule with delivery history
  app.get("/api/subscriptions/:id/schedule", requireUser(), async (req: AuthenticatedUserRequest, res) => {
    try {
      const userId = req.authenticatedUser!.userId;
      const subscription = await storage.getSubscription(req.params.id);

      if (!subscription) {
        res.status(404).json({ message: "Subscription not found" });
        return;
      }

      if (subscription.userId !== userId) {
        res.status(403).json({ message: "Unauthorized" });
        return;
      }

      const plan = await storage.getSubscriptionPlan(subscription.planId);
      if (!plan) {
        res.status(404).json({ message: "Subscription plan not found" });
        return;
      }

      const logs = await storage.getSubscriptionDeliveryLogs(req.params.id);

      const scheduleItems = logs.map(log => ({
        date: log.date,
        time: log.time,
        items: plan.items,
        status: log.status === "delivered" ? "delivered" : "pending"
      }));

      res.json({
        subscription,
        plan,
        schedule: scheduleItems,
        remainingDeliveries: subscription.remainingDeliveries,
        totalDeliveries: subscription.totalDeliveries,
        deliveryHistory: logs
      });
    } catch (error: any) {
      console.error("Error fetching subscription schedule:", error);
      res.status(500).json({ message: error.message || "Failed to fetch schedule" });
    }
  });

  // Cancel subscription route removed - users can only pause/resume
  // Admin can manage subscriptions through admin routes if needed

  // Public delivery settings endpoint (no auth required for cart calculations)
  app.get("/api/delivery-settings", async (req, res) => {
    try {
      const settings = await storage.getDeliverySettings();
      res.json(settings);
    } catch (error: any) {
      console.error("Error fetching delivery settings:", error);
      res.status(500).json({ message: error.message || "Failed to fetch delivery settings" });
    }
  });

  // Cart Settings APIs - Public endpoint to get cart minimum order settings
  app.get("/api/cart-settings", async (req, res) => {
    try {
      const settings = await storage.getCartSettings();
      res.json(settings);
    } catch (error: any) {
      console.error("Error fetching cart settings:", error);
      res.status(500).json({ message: error.message || "Failed to fetch cart settings" });
    }
  });

  app.get("/api/cart-settings/category/:categoryId", async (req, res) => {
    try {
      const setting = await storage.getCartSettingByCategoryId(req.params.categoryId);
      if (!setting) {
        res.status(404).json({ message: "Cart setting not found for this category" });
        return;
      }
      res.json(setting);
    } catch (error: any) {
      console.error("Error fetching cart setting:", error);
      res.status(500).json({ message: error.message || "Failed to fetch cart setting" });
    }
  });

  // ================== Roti Settings APIs ==================
  
  // Public: Get roti time settings (for checkout blocking logic)
  app.get("/api/roti-settings", async (req, res) => {
    try {
      let settings = await storage.getRotiSettings();
      
      // Return default settings if none exist
      if (!settings) {
        settings = {
          id: "",
          morningBlockStartTime: "08:00",
          morningBlockEndTime: "11:00",
          lastOrderTime: "23:00",
          blockMessage: "Roti orders are not available from 8 AM to 11 AM. Please order before 11 PM for next morning delivery.",
          prepareWindowHours: 2,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
      
      // Calculate if currently in blocked period
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTimeMinutes = currentHour * 60 + currentMinutes;
      
      const [startHour, startMin] = settings.morningBlockStartTime.split(":").map(Number);
      const [endHour, endMin] = settings.morningBlockEndTime.split(":").map(Number);
      const [lastHour, lastMin] = settings.lastOrderTime.split(":").map(Number);
      
      const blockStartMinutes = startHour * 60 + startMin;
      const blockEndMinutes = endHour * 60 + endMin;
      const lastOrderMinutes = lastHour * 60 + lastMin;
      
      const isInBlockedPeriod = currentTimeMinutes >= blockStartMinutes && currentTimeMinutes < blockEndMinutes;
      const isPastLastOrderTime = currentTimeMinutes >= lastOrderMinutes;
      
      res.json({
        ...settings,
        isInBlockedPeriod,
        isPastLastOrderTime,
        currentTime: `${String(currentHour).padStart(2, "0")}:${String(currentMinutes).padStart(2, "0")}`,
      });
    } catch (error: any) {
      console.error("Error fetching roti settings:", error);
      res.status(500).json({ message: error.message || "Failed to fetch roti settings" });
    }
  });

  // Public wallet settings endpoint (for checkout page)
  app.get("/api/wallet-settings", async (req, res) => {
    try {
      const walletSetting = await db.query.walletSettings.findFirst({
        where: (ws, { eq }) => eq(ws.isActive, true)
      });

      const defaultWallet = { 
        maxUsagePerOrder: 10, 
        minOrderAmount: 0,
        referrerBonus: 100, 
        referredBonus: 50 
      };

      const response = walletSetting || defaultWallet;
      console.log("[WALLET] Public endpoint returning:", response);
      res.json(response);
    } catch (error: any) {
      console.error("Error fetching wallet settings:", error);
      res.status(500).json({ message: error.message || "Failed to fetch wallet settings" });
    }
  });

  // Admin: Update roti time settings
  app.put("/api/admin/roti-settings", requireAdmin(), async (req: any, res) => {
    try {
      const { morningBlockStartTime, morningBlockEndTime, lastOrderTime, blockMessage, prepareWindowHours, isActive } = req.body;
      
      // Validate time formats
      const timeRegex = /^\d{2}:\d{2}$/;
      if (morningBlockStartTime && !timeRegex.test(morningBlockStartTime)) {
        res.status(400).json({ message: "Invalid morningBlockStartTime format. Use HH:mm" });
        return;
      }
      if (morningBlockEndTime && !timeRegex.test(morningBlockEndTime)) {
        res.status(400).json({ message: "Invalid morningBlockEndTime format. Use HH:mm" });
        return;
      }
      if (lastOrderTime && !timeRegex.test(lastOrderTime)) {
        res.status(400).json({ message: "Invalid lastOrderTime format. Use HH:mm" });
        return;
      }
      
      // Validate prepareWindowHours
      if (prepareWindowHours !== undefined && (typeof prepareWindowHours !== "number" || prepareWindowHours < 1 || prepareWindowHours > 24)) {
        res.status(400).json({ message: "Prepare window hours must be between 1 and 24" });
        return;
      }
      
      const settings = await storage.updateRotiSettings({
        morningBlockStartTime,
        morningBlockEndTime,
        lastOrderTime,
        blockMessage,
        prepareWindowHours,
        isActive,
      });
      
      res.json(settings);
    } catch (error: any) {
      console.error("Error updating roti settings:", error);
      res.status(500).json({ message: error.message || "Failed to update roti settings" });
    }
  });

  // Admin: Assign a chef/partner to a subscription
  app.patch("/api/admin/subscriptions/:id/assign-chef", requireAdmin(), async (req: any, res) => {
    try {
      const { chefId } = req.body;
      if (!chefId) {
        res.status(400).json({ message: "Chef ID is required" });
        return;
      }

      const subscription = await storage.getSubscription(req.params.id);
      if (!subscription) {
        res.status(404).json({ message: "Subscription not found" });
        return;
      }

      const chef = await storage.getChefById(chefId);
      if (!chef) {
        res.status(404).json({ message: "Chef not found" });
        return;
      }

      const updated = await storage.updateSubscription(req.params.id, { chefId, chefAssignedAt: new Date() });
      console.log(`👨‍🍳 Subscription ${req.params.id} assigned to chef ${chefId}`);

      if (!updated) {
        res.status(500).json({ message: "Failed to update subscription" });
        return;
      }

      // Get plan name for notification (safe now that `updated` exists)
      const plan = await storage.getSubscriptionPlan(updated.planId);

      // Broadcast the subscription update
      const { broadcastSubscriptionUpdate, broadcastSubscriptionAssignmentToPartner } = await import("./websocket");
      broadcastSubscriptionUpdate(updated);
      // Notify the assigned partner
      await broadcastSubscriptionAssignmentToPartner(updated, chef.name, plan?.name);

      res.json(updated);
    } catch (error: any) {
      console.error("Error assigning chef to subscription:", error);
      res.status(500).json({ message: error.message || "Failed to assign chef" });
    }
  });

  // Admin: Get subscriptions needing reassignment (assigned but not delivered for 1-2 days)
  app.get("/api/admin/subscriptions/reassignment-pending", requireAdmin(), async (req: any, res) => {
    try {
      const allSubscriptions = await storage.getSubscriptions();
      const allOrders = await storage.getAllOrders();
      const now = new Date();
      const reassignmentThresholdDays = 2; // Reassign if no delivery in 2 days

      const pendingReassignments = allSubscriptions.filter(sub => {
        // Must have a chef assigned
        if (!sub.chefId || !sub.chefAssignedAt) return false;

        // Must be active and paid
        if (sub.status !== "active" || !sub.isPaid) return false;

        // Check if assigned more than threshold days ago AND no recent delivery
        const daysSinceAssignment = Math.floor((now.getTime() - new Date(sub.chefAssignedAt).getTime()) / (1000 * 60 * 60 * 24));
        const daysSinceLastDelivery = sub.lastDeliveryDate ? Math.floor((now.getTime() - new Date(sub.lastDeliveryDate).getTime()) / (1000 * 60 * 60 * 24)) : daysSinceAssignment;

        // Flag for reassignment if assigned 2+ days ago with no delivery
        return daysSinceAssignment >= reassignmentThresholdDays && daysSinceLastDelivery >= reassignmentThresholdDays;
      });

      // Fetch chef details for each subscription
      const enrichedReassignments = await Promise.all(pendingReassignments.map(async (sub) => {
        const chef = sub.chefId ? await storage.getChefById(sub.chefId) : null;
        const plan = await storage.getSubscriptionPlan(sub.planId);
        
        // Check if there's a scheduled order that wasn't completed
        // Since orders don't have subscriptionId field, match by deliverySlot
        const subscriptionOrders = allOrders.filter(o => 
          o.deliverySlotId === sub.deliverySlotId && 
          o.status !== "completed" && 
          o.status !== "cancelled"
        );
        
        const overdueOrders = subscriptionOrders.filter(o => {
          if (!o.deliveryTime || !o.deliveryDate) return false;
          const orderTime = new Date(`${o.deliveryDate}T${o.deliveryTime}`);
          return orderTime < now;
        });
        
        return {
          ...sub,
          currentChefName: chef?.name,
          planName: plan?.name,
          overdueOrderCount: overdueOrders.length,
          overdueOrders: overdueOrders.map(o => ({
            id: o.id,
            status: o.status,
            scheduledFor: o.deliveryDate,
            time: o.deliveryTime,
          })),
        };
      }));

      console.log(`⚠️ Found ${enrichedReassignments.length} subscriptions pending reassignment`);
      if (enrichedReassignments.length > 0) {
        console.log(`📋 Details:`, enrichedReassignments.map(r => ({
          subscriptionId: r.id,
          chef: r.currentChefName,
          overdueOrders: r.overdueOrderCount,
        })));
      }
      res.json(enrichedReassignments);
    } catch (error: any) {
      console.error("Error fetching pending reassignments:", error);
      res.status(500).json({ message: error.message || "Failed to fetch pending reassignments" });
    }
  });

  // Admin: Reassign subscription to a different chef
  app.patch("/api/admin/subscriptions/:id/reassign-chef", requireAdmin(), async (req: any, res) => {
    try {
      const { newChefId } = req.body;
      if (!newChefId) {
        res.status(400).json({ message: "New chef ID is required" });
        return;
      }

      const subscription = await storage.getSubscription(req.params.id);
      if (!subscription) {
        res.status(404).json({ message: "Subscription not found" });
        return;
      }

      const newChef = await storage.getChefById(newChefId);
      if (!newChef) {
        res.status(404).json({ message: "Chef not found" });
        return;
      }

      const oldChefId = subscription.chefId;
      const updated = await storage.updateSubscription(req.params.id, { chefId: newChefId, chefAssignedAt: new Date() });

      console.log(`🔄 Subscription ${req.params.id} reassigned from chef ${oldChefId} to ${newChefId}`);
      res.json({ 
        message: "Subscription reassigned successfully", 
        subscription: updated,
        previousChefId: oldChefId,
        newChefId: newChefId
      });
    } catch (error: any) {
      console.error("Error reassigning subscription:", error);
      res.status(500).json({ message: error.message || "Failed to reassign subscription" });
    }
  });

  // Admin: Reschedule a subscription order to next available slot (when chef didn't complete)
  app.post("/api/admin/subscriptions/:id/reschedule-order", requireAdmin(), async (req: any, res) => {
    try {
      const { orderId, reason } = req.body;
      if (!orderId) {
        res.status(400).json({ message: "Order ID is required" });
        return;
      }

      const subscription = await storage.getSubscription(req.params.id);
      if (!subscription) {
        res.status(404).json({ message: "Subscription not found" });
        return;
      }

      const order = await storage.getOrderById(orderId);
      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }

      // Check if order belongs to this subscription (by comparing dates/slot, since subscriptionId isn't in schema)
      // For now, just proceed if order exists

      // Get the subscription's delivery slot details
      if (!subscription.deliverySlotId) {
        res.status(400).json({ message: "Subscription has no delivery slot" });
        return;
      }

      const slot = await storage.getDeliveryTimeSlot(subscription.deliverySlotId);
      if (!slot) {
        res.status(400).json({ message: "Delivery slot not found for subscription" });
        return;
      }

      // Calculate next available delivery date using the slot cutoff logic
      const cutoffInfo = computeSlotCutoffInfo(slot);
      const nextDeliveryDate = new Date(cutoffInfo.nextAvailableDate);
      // Move to the next occurrence after the current scheduled date
      nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 1);

      console.log(`📅 Rescheduling subscription ${req.params.id}, order ${orderId} to ${nextDeliveryDate.toISOString()}`);
      console.log(`   Reason: ${reason || 'Chef did not complete delivery'}`);

      // Update subscription with new delivery date and unassign chef (needs reassignment for next cycle)
      const updatedSubscription = await storage.updateSubscription(req.params.id, {
        nextDeliveryDate: nextDeliveryDate,
        chefId: null,
        chefAssignedAt: null,
      });

      // Update order status to "rescheduled" to indicate it's been moved
      await storage.updateOrderStatus(orderId, "rescheduled");

      // Create a new order for the new delivery date with the same items
      const newOrderData = {
        userId: order.userId,
        customerName: order.customerName,
        phone: order.phone,
        email: order.email || "",
        address: order.address,
        items: order.items as any,
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        discount: order.discount,
        total: order.total,
        status: "pending",
        deliveryDate: nextDeliveryDate.toISOString().split('T')[0],
        deliveryTime: slot.startTime,
        deliverySlotId: subscription.deliverySlotId,
        categoryId: order.categoryId,
        categoryName: order.categoryName,
        chefId: order.chefId,
        chefName: order.chefName,
        paymentStatus: order.paymentStatus,
      };

      const newOrder = await storage.createOrder(newOrderData as any);

      console.log(`✅ New order created: ${newOrder.id} for reschedule`);

      // Notify user about the reschedule
      console.log(`📬 Notifying user ${order.userId} about rescheduled delivery on ${nextDeliveryDate.toDateString()}`);

      res.json({
        message: "Order rescheduled successfully",
        updatedSubscription,
        rescheduledOrder: order,
        newOrder: newOrder,
        newDeliveryDate: nextDeliveryDate,
        reason: reason || "Chef did not complete delivery",
      });
    } catch (error: any) {
      console.error("Error rescheduling order:", error);
      res.status(500).json({ message: error.message || "Failed to reschedule order" });
    }
  });

  // Admin: Auto-reschedule all overdue orders
  app.post("/api/admin/subscriptions/auto-reschedule-overdue", requireAdmin(), async (req: any, res) => {
    try {
      const allSubscriptions = await storage.getSubscriptions();
      const allOrders = await storage.getAllOrders();
      const now = new Date();
      let rescheduledCount = 0;
      const results: any[] = [];

      for (const subscription of allSubscriptions) {
        // Only process active subscriptions with assigned chef
        if (subscription.status !== "active" || !subscription.chefId) continue;

        // Find all non-completed orders for this subscription
        // Since orders don't have subscriptionId, check by deliveryDate/slot matching
        const subscriptionOrders = allOrders.filter(o => 
          o.deliverySlotId === subscription.deliverySlotId &&
          o.status !== "completed" && 
          o.status !== "cancelled" &&
          o.status !== "rescheduled"
        );

        // Find overdue orders (scheduled time has passed)
        const overdueOrders = subscriptionOrders.filter(o => {
          const orderTime = o.deliveryTime && o.deliveryDate
            ? new Date(`${o.deliveryDate}T${o.deliveryTime}`)
            : o.deliveryDate ? new Date(o.deliveryDate) : null;
          return orderTime && orderTime < now;
        });

        // Reschedule each overdue order
        for (const order of overdueOrders) {
          try {
            if (!subscription.deliverySlotId) continue;

            const slot = await storage.getDeliveryTimeSlot(subscription.deliverySlotId);
            if (!slot) continue;

            const cutoffInfo = computeSlotCutoffInfo(slot);
            const nextDeliveryDate = new Date(cutoffInfo.nextAvailableDate);
            nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 1);

            // Update subscription
            await storage.updateSubscription(subscription.id, {
              nextDeliveryDate: nextDeliveryDate,
              chefId: null,
              chefAssignedAt: null,
            });

            // Mark old order as rescheduled
            await storage.updateOrderStatus(order.id, "rescheduled");

            // Create new order for rescheduled date
            const newOrderData = {
              userId: order.userId,
              customerName: order.customerName,
              phone: order.phone,
              email: order.email || "",
              address: order.address,
              items: order.items as any,
              subtotal: order.subtotal,
              deliveryFee: order.deliveryFee,
              discount: order.discount,
              total: order.total,
              status: "pending",
              deliveryDate: nextDeliveryDate.toISOString().split('T')[0],
              deliveryTime: slot.startTime,
              deliverySlotId: subscription.deliverySlotId,
              categoryId: order.categoryId,
              categoryName: order.categoryName,
              chefId: order.chefId,
              chefName: order.chefName,
              paymentStatus: order.paymentStatus,
            };

            const newOrder = await storage.createOrder(newOrderData as any);

            rescheduledCount++;
            results.push({
              subscriptionId: subscription.id,
              orderId: order.id,
              newOrderId: newOrder.id,
              newDeliveryDate: nextDeliveryDate,
              reason: "Auto-rescheduled: Chef did not complete delivery",
            });

            console.log(`✅ Auto-rescheduled subscription ${subscription.id}, order ${order.id} to ${nextDeliveryDate.toDateString()}`);
          } catch (error) {
            console.error(`❌ Failed to reschedule order ${order.id}:`, error);
            results.push({
              subscriptionId: subscription.id,
              orderId: order.id,
              error: "Failed to reschedule",
            });
          }
        }
      }

      console.log(`🔄 Auto-reschedule complete: ${rescheduledCount} orders rescheduled`);
      res.json({
        message: "Auto-reschedule complete",
        rescheduledCount,
        results,
      });
    } catch (error: any) {
      console.error("Error in auto-reschedule:", error);
      res.status(500).json({ message: error.message || "Failed to auto-reschedule orders" });
    }
  });

  // ============ DELIVERY FEE ENDPOINTS ============

  // POST /api/geocode - Convert address/pincode to coordinates using OpenStreetMap
  // Smart address geocoding with fallback for vague addresses
  app.post("/api/geocode", async (req, res) => {
    try {
      const { address, pincode } = req.body;

      if (!address && !pincode) {
        return res.status(400).json({
          success: false,
          message: "Either address or pincode must be provided",
        });
      }

      const query = address || pincode;
      console.log(`[GEOCODE] Attempting to geocode: "${query}"`);

      // Helper function to geocode an address
      const geocodeQuery = async (searchQuery: string) => {
        try {
          const response = await axios.get("https://nominatim.openstreetmap.org/search", {
            params: {
              q: searchQuery,
              format: "json",
              limit: 1,
              addressdetails: 1,
            },
            headers: {
              "User-Agent": "Replitrotihai-App",
            },
            timeout: 5000,
          });

          if (response.data && response.data.length > 0) {
            return response.data[0];
          }
          return null;
        } catch (error) {
          console.error(`[GEOCODE] Error geocoding "${searchQuery}":`, error instanceof Error ? error.message : error);
          return null;
        }
      };

      // First attempt: Try the exact address/pincode as provided
      let result = await geocodeQuery(query);

      // Second attempt: If address provided, try appending Mumbai for context
      if (!result && address) {
        const withMumbai = address + ", Mumbai";
        console.log(`[GEOCODE] Trying with Mumbai context: "${withMumbai}"`);
        result = await geocodeQuery(withMumbai);
      }

      // Third attempt: Extract area keywords when full address fails
      // This handles: "39/18, LJG colony, Kurla west, Mumbai" → extracts "Kurla west, Mumbai"
      if (!result && address) {
        console.log(`[GEOCODE] Full address failed, attempting area extraction...`);
        
        const areaKeywords = [
          "kurla", "bandra", "andheri", "dadar", "colaba", "mahim",
          "worli", "powai", "thane", "airoli", "mulund", "borivali",
          "malad", "kandivali", "goregaon", "dombivli", "navi", "vile parle",
          "santacruz", "chembur", "vikhroli", "ghatkopar", "kanjurmarg"
        ];

        const addressLower = address.toLowerCase();
        
        // Find the LAST (rightmost) occurrence of any area keyword
        // This skips shop/building names that come before the area
        let lastAreaIndex = -1;
        let lastAreaKeyword = "";
        
        for (const keyword of areaKeywords) {
          const index = addressLower.lastIndexOf(keyword);
          if (index > lastAreaIndex) {
            lastAreaIndex = index;
            lastAreaKeyword = keyword;
          }
        }

        // If we found an area keyword, extract from there onwards
        if (lastAreaKeyword) {
          // Get the substring starting from the area keyword
          const extractedArea = address.substring(lastAreaIndex).trim();
          const areaQuery = extractedArea + ", Mumbai";
          
          console.log(`[GEOCODE] Extracted area: "${areaQuery}" from full address`);
          result = await geocodeQuery(areaQuery);
          
          if (result) {
            console.log(`[GEOCODE] ✅ Area extraction successful: "${areaQuery}"`);
          }
        }
      }

      // If we got a result, return it
      if (result) {
        const latitude = parseFloat(result.lat);
        const longitude = parseFloat(result.lon);
        const formattedAddress = result.display_name || query;

        console.log(`✅ [GEOCODE] Successfully geocoded: ${query} -> (${latitude}, ${longitude})`);

        res.json({
          success: true,
          latitude,
          longitude,
          formattedAddress,
        });
      } else {
        console.warn(`❌ [GEOCODE] Could not geocode: ${query}`);
        return res.status(404).json({
          success: false,
          message: "Address not found. Try using area name (e.g., 'Kurla West, Mumbai') or click on map to select your location.",
        });
      }
    } catch (error: any) {
      console.error("[GEOCODE] Geocoding error:", error.message);

      if (error.code === "ECONNABORTED") {
        return res.status(504).json({
          success: false,
          message: "Geocoding service timeout. Please try again.",
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to geocode address. Please try again.",
      });
    }
  });

  // POST /api/calculate-delivery-fee - Calculate delivery fee based on location and order amount
  app.post("/api/calculate-delivery-fee", async (req, res) => {
    try {
      const { chefId, customerLatitude, customerLongitude, orderAmount } = req.body;

      if (!chefId) {
        return res.status(400).json({
          success: false,
          message: "chefId is required",
        });
      }

      if (typeof orderAmount !== "number" || orderAmount < 0) {
        return res.status(400).json({
          success: false,
          message: "orderAmount must be a non-negative number",
        });
      }

      // Get chef details
      const chef = await storage.getChefById(chefId);
      if (!chef) {
        return res.status(404).json({
          success: false,
          message: "Chef not found",
        });
      }

      // Calculate distance if location provided
      let distance: number | null = null;

      if (customerLatitude && customerLongitude && chef.latitude && chef.longitude) {
        // Haversine formula to calculate distance between two coordinates
        const R = 6371; // Earth's radius in km
        const dLat = ((chef.latitude - customerLatitude) * Math.PI) / 180;
        const dLng = ((chef.longitude - customerLongitude) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((customerLatitude * Math.PI) / 180) *
            Math.cos((chef.latitude * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        distance = Math.round((R * c + Number.EPSILON) * 100) / 100; // Round to 2 decimals
      }

      // Use storage helper to calculate delivery fee
      const feeResult = await storage.calculateDeliveryFee(
        distance !== null,
        distance || 0,
        orderAmount,
        chef
      );

      console.log(`✅ Calculated delivery fee for chef ${chefId}: ${feeResult.deliveryFee}, distance: ${distance}km, isFree: ${feeResult.isFreeDelivery}`);

      res.json({
        success: true,
        distance: distance || 0,
        deliveryFee: feeResult.deliveryFee,
        isFreeDelivery: feeResult.isFreeDelivery,
        breakdown: {
          subtotal: orderAmount,
          deliveryFee: feeResult.deliveryFee,
          total: orderAmount + (feeResult.isFreeDelivery ? 0 : feeResult.deliveryFee),
        },
      });
    } catch (error: any) {
      console.error("Delivery fee calculation error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to calculate delivery fee",
      });
    }
  });

  const httpServer = createServer(app);
  setupWebSocket(httpServer);

  return httpServer;
}