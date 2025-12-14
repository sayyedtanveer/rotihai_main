#!/usr/bin/env node

/**
 * Simple Test Login Token Generator
 * Generates JWT tokens without database dependencies
 * Usage: npx ts-node scripts/gen-token.ts [username] [role]
 */

import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "admin-jwt-secret-change-in-production";
const JWT_EXPIRES_IN = "7d";

interface AdminTokenPayload {
  adminId: string;
  username: string;
  email: string;
  role: string;
}

function generateAccessToken(username: string, role: string = "super_admin"): string {
  const payload: AdminTokenPayload = {
    adminId: `admin-${username}`,
    username: username,
    email: `${username}@rotihai.com`,
    role: role,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function generateRefreshToken(username: string, role: string = "super_admin"): string {
  const payload: AdminTokenPayload = {
    adminId: `admin-${username}`,
    username: username,
    email: `${username}@rotihai.com`,
    role: role,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

const username = process.argv[2] || "admin";
const role = process.argv[3] || "super_admin";

console.log("\n🔓 Test Token Generator (Development Only)\n");
console.log("═".repeat(60));

const accessToken = generateAccessToken(username, role);
const refreshToken = generateRefreshToken(username, role);

console.log(`\n✅ Tokens generated for: ${username} (${role})\n`);

console.log("📌 ACCESS TOKEN:");
console.log(accessToken);

console.log("\n📌 REFRESH TOKEN:");
console.log(refreshToken);

console.log("\n═".repeat(60));
console.log("\n📝 Usage Instructions:\n");
console.log("1. Copy the ACCESS TOKEN above");
console.log("2. Add to request header:");
console.log('   Authorization: Bearer <ACCESS_TOKEN>\n');

console.log("3. Or use with curl:");
console.log(`   curl -H "Authorization: Bearer ${accessToken.substring(0, 20)}..." \\`);
console.log('     http://localhost:5000/api/admin/dashboard\n');

console.log("4. Or paste in Authorization tab of Postman");
console.log("   Type: Bearer Token");
console.log(`   Token: ${accessToken}\n`);

console.log("═".repeat(60) + "\n");
