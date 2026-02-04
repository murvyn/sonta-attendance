import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5433', 10),
  username: process.env.DATABASE_USER || 'sonta',
  password: process.env.DATABASE_PASSWORD || 'sonta_password',
  database: process.env.DATABASE_NAME || 'sonta_attendance',
});

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected');

    // Check if super admin exists
    const existingAdmin = await AppDataSource.query(
      "SELECT * FROM admin_users WHERE username = 'superadmin'"
    );

    if (existingAdmin.length > 0) {
      console.log('Super admin already exists');
      await AppDataSource.destroy();
      return;
    }

    // Create super admin
    const passwordHash = await bcrypt.hash('Admin@123', 12);

    await AppDataSource.query(
      `INSERT INTO admin_users (username, email, password_hash, full_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      ['superadmin', 'admin@sonta.local', passwordHash, 'Super Admin', 'super_admin', true]
    );

    console.log('Super admin created successfully!');
    console.log('Username: superadmin');
    console.log('Password: Admin@123');
    console.log('');
    console.log('IMPORTANT: Change this password after first login!');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
