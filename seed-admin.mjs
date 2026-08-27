import postgres from 'postgres';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config({ path: '.env.local' });

async function seedAdmin() {
  const sql = postgres(process.env.DATABASE_URL);
  const email = 'admin@gmail.com';
  const password = 'Admin@123.';

  console.log(`Seeding admin user: ${email}`);

  // Hash the password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  const id = uuidv4();

  try {
    await sql`
      INSERT INTO users (id, email, name, password_hash, role)
      VALUES (${id}, ${email}, 'Super Admin', ${passwordHash}, 'super_admin')
    `;
    console.log('Admin user seeded successfully!');
    process.exit(0);
  } catch (err) {
    if (err.code === '23505') {
      console.log('Admin user already exists.');
      process.exit(0);
    } else {
      console.error('Failed to seed admin:', err);
      process.exit(1);
    }
  }
}

seedAdmin();
