import { db, adminUsers } from '../shared/db';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';

/**
 * Seed Admin Data to Neon DB Live Server
 * 
 * Usage:
 * - Development: DATABASE_URL=your_neon_url npx tsx scripts/seed-admin-neon.ts
 * - Production: NODE_ENV=production DATABASE_URL=your_neon_url npx tsx scripts/seed-admin-neon.ts
 * 
 * This script:
 * 1. Deletes all existing admin users (fresh start)
 * 2. Inserts comprehensive admin user accounts
 * 3. Sets up role-based access (super_admin, manager, viewer)
 */

interface AdminUserData {
  username: string;
  email: string;
  phone?: string;
  password: string;
  role: 'super_admin' | 'manager' | 'viewer';
}

async function seedAdminData() {
  console.log('🔄 Starting admin data seed to Neon DB...\n');
  
  try {
    // Step 1: Delete all existing admin users (fresh start)
    console.log('📋 Step 1: Clearing existing admin users...');
    const existingAdmins = await db.select().from(adminUsers);
    
    if (existingAdmins.length > 0) {
      console.log(`   Found ${existingAdmins.length} existing admin user(s)`);
      
      for (const admin of existingAdmins) {
        await db.delete(adminUsers).where(eq(adminUsers.id, admin.id));
        console.log(`   ✓ Deleted: ${admin.username} (${admin.email})`);
      }
      
      console.log(`   ✅ All ${existingAdmins.length} admin user(s) removed\n`);
    } else {
      console.log('   ✓ No existing admin users found\n');
    }

    // Step 2: Define new admin users with roles
    console.log('📋 Step 2: Preparing new admin user data...');
    
    const newAdmins: AdminUserData[] = [
      // Super Admin - Full access to everything
      {
        username: 'admin',
        email: 'admin@rotihai.com',
        phone: '9900000000',
        password: 'Admin@123456',
        role: 'super_admin',
      },
      {
        username: 'sayyedtanveer',
        email: 'sayyed.tanveer@rotihai.com',
        phone: '9773765103',
        password: 'RotiHai@2024',
        role: 'super_admin',
      },
      
      // Managers - Can manage content, users, and orders
      {
        username: 'manager_content',
        email: 'manager.content@rotihai.com',
        phone: '9900000001',
        password: 'Manager@123456',
        role: 'manager',
      },
      {
        username: 'manager_orders',
        email: 'manager.orders@rotihai.com',
        phone: '9900000002',
        password: 'Manager@123456',
        role: 'manager',
      },
      {
        username: 'manager_users',
        email: 'manager.users@rotihai.com',
        phone: '9900000003',
        password: 'Manager@123456',
        role: 'manager',
      },
      
      // Viewers - Read-only access
      {
        username: 'viewer_analytics',
        email: 'viewer.analytics@rotihai.com',
        phone: '9900000004',
        password: 'Viewer@123456',
        role: 'viewer',
      },
      {
        username: 'viewer_reports',
        email: 'viewer.reports@rotihai.com',
        phone: '9900000005',
        password: 'Viewer@123456',
        role: 'viewer',
      },
    ];

    console.log(`   ✓ Prepared ${newAdmins.length} admin user(s)\n`);

    // Step 3: Hash passwords and insert admin users
    console.log('📋 Step 3: Inserting new admin users...');
    
    const insertedAdmins = [];
    for (const adminData of newAdmins) {
      try {
        const passwordHash = await bcrypt.hash(adminData.password, 10);
        const adminId = nanoid();
        
        await db.insert(adminUsers).values({
          id: adminId,
          username: adminData.username,
          email: adminData.email,
          phone: adminData.phone,
          passwordHash,
          role: adminData.role,
          lastLoginAt: null,
        });

        insertedAdmins.push({
          id: adminId,
          username: adminData.username,
          email: adminData.email,
          role: adminData.role,
        });

        console.log(`   ✓ Created: ${adminData.username.padEnd(20)} | ${adminData.role.padEnd(12)} | ${adminData.email}`);
      } catch (error: any) {
        console.error(`   ✗ Failed to create ${adminData.username}:`, error.message);
        throw error;
      }
    }

    console.log(`\n   ✅ Successfully inserted ${insertedAdmins.length} admin user(s)\n`);

    // Step 4: Verification
    console.log('📋 Step 4: Verifying inserted data...');
    const allAdmins = await db.select().from(adminUsers);
    
    console.log(`   ✓ Total admin users in database: ${allAdmins.length}`);
    console.log('\n   Admin Users Summary:');
    console.log('   ' + '='.repeat(80));
    
    const superAdmins = allAdmins.filter(a => a.role === 'super_admin');
    const managers = allAdmins.filter(a => a.role === 'manager');
    const viewers = allAdmins.filter(a => a.role === 'viewer');
    
    console.log(`   Super Admins: ${superAdmins.length}`);
    superAdmins.forEach(a => console.log(`      • ${a.username} (${a.email})`));
    
    console.log(`\n   Managers: ${managers.length}`);
    managers.forEach(a => console.log(`      • ${a.username} (${a.email})`));
    
    console.log(`\n   Viewers: ${viewers.length}`);
    viewers.forEach(a => console.log(`      • ${a.username} (${a.email})`));
    
    console.log('\n   ' + '='.repeat(80));

    // Step 5: Display login information
    console.log('\n🔐 Login Credentials:');
    console.log('   ' + '='.repeat(80));
    newAdmins.forEach(admin => {
      console.log(`   Username: ${admin.username.padEnd(20)} | Password: ${admin.password}`);
    });
    console.log('   ' + '='.repeat(80));

    // Step 6: Success summary
    console.log('\n✅ SUCCESS! Admin data seeded to Neon DB\n');
    console.log('Summary:');
    console.log(`   • Total admins created: ${allAdmins.length}`);
    console.log(`   • Super Admins: ${superAdmins.length}`);
    console.log(`   • Managers: ${managers.length}`);
    console.log(`   • Viewers: ${viewers.length}`);
    console.log('\n💾 All changes committed to Neon DB\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ SEED FAILED!\n');
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the seed
seedAdminData();
