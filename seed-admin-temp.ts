import { db } from './src/lib/db/index.js';
import { users } from './src/lib/db/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function seedAdmin() {
  const email = 'admin@gmail.com';
  const password = 'Admin@123.';
  
  const [existing] = await db.select().from(users).where(eq(users.email, email));
  if (existing) {
    console.log('Admin already exists! Deleting and recreating to ensure correct password...');
    await db.delete(users).where(eq(users.email, email));
  }
  
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  
  await db.insert(users).values({
    email,
    passwordHash,
    name: 'Super Admin',
    role: 'admin',
    isActive: true,
    emailVerified: true
  });
  
  console.log('Admin seeded successfully with email: ' + email + ' and password: ' + password);
  process.exit(0);
}

seedAdmin().catch(console.error);
