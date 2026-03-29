import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { Request, Response, NextFunction } from "express";
import type { DeliveryPersonnel } from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "delivery-jwt-secret-change-in-production";
// Delivery sessions: 90 days (only logout on explicit logout)
const JWT_EXPIRES_IN = "90d"; // Increased from 7d to 90d for persistent sessions
const REFRESH_TOKEN_EXPIRES_IN = "90d"; // Long-lived refresh token also 90d

export interface DeliveryTokenPayload {
  deliveryId: string;
  name: string;
  phone: string;
}

export interface AuthenticatedDeliveryRequest extends Request {
  delivery?: DeliveryTokenPayload;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateDeliveryToken(deliveryPerson: DeliveryPersonnel): string {
  const payload: DeliveryTokenPayload = {
    deliveryId: deliveryPerson.id,
    name: deliveryPerson.name,
    phone: deliveryPerson.phone,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function generateRefreshToken(deliveryPerson: DeliveryPersonnel): string {
  const payload: DeliveryTokenPayload = {
    deliveryId: deliveryPerson.id,
    name: deliveryPerson.name,
    phone: deliveryPerson.phone,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
}

export function verifyToken(token: string): DeliveryTokenPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as DeliveryTokenPayload;
    console.log("[DELIVERY-VERIFY-TOKEN] ✅ Token verified with JWT_SECRET:", JWT_SECRET.substring(0, 10) + "...");
    return payload;
  } catch (error: any) {
    console.error("[DELIVERY-VERIFY-TOKEN] ❌ Token verification failed:", {
      jwtSecret: JWT_SECRET.substring(0, 10) + "...",
      errorName: error?.name,
      errorMessage: error?.message,
      tokenLength: token.length
    });
    return null;
  }
}

export function requireDeliveryAuth() {
  return (req: AuthenticatedDeliveryRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    console.log("[DELIVERY-AUTH] 🔐 Auth check:", {
      url: req.path,
      hasAuthHeader: !!authHeader,
      authHeaderStart: authHeader?.substring(0, 20) || 'MISSING'
    });

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("[DELIVERY-AUTH] ❌ No Bearer token found");
      res.status(401).json({ message: "No token provided" });
      return;
    }

    const token = authHeader.substring(7);
    console.log("[DELIVERY-AUTH] 🔍 Token details:", {
      url: req.path,
      tokenLength: token.length,
      tokenStart: token.substring(0, 20),
      tokenEnd: token.substring(token.length - 20)
    });

    const payload = verifyToken(token);

    if (!payload) {
      console.error("[DELIVERY-AUTH] ❌ Token verification failed:", {
        url: req.path,
        tokenLength: token.length,
        jwtSecret: process.env.JWT_SECRET ? "SET" : "USING DEFAULT"
      });
      res.status(401).json({ message: "Invalid or expired token" });
      return;
    }

    console.log("[DELIVERY-AUTH] ✅ Token verified successfully:", {
      url: req.path,
      deliveryId: payload.deliveryId,
      name: payload.name
    });

    req.delivery = payload;
    next();
  };
}
