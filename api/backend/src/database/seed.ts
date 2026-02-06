import { DataSource } from 'typeorm';
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

    // Check if super admin exists by email
    const existingAdmin = await AppDataSource.query(
      'SELECT * FROM admin_users WHERE email = $1',
      ['marvin.asamoah.123@gmail.com'],
    );

    if (existingAdmin.length > 0) {
      console.log('Super admin already exists');
      await AppDataSource.destroy();
      return;
    }

    // Create super admin (magic link auth - no password needed)
    await AppDataSource.query(
      `INSERT INTO admin_users (email, full_name, role, is_active)
       VALUES ($1, $2, $3, $4)`,
      ['marvin.asamoah.123@gmail.com', 'Marvin Asamoah', 'super_admin', true],
    );

    console.log('Super admin created successfully!');
    console.log('Email: marvin.asamoah.123@gmail.com');
    console.log('');
    console.log('Use the magic link login to sign in.');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
