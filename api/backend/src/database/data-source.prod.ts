import { DataSource } from 'typeorm';

// Production data source configuration (uses compiled JS files)
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER || 'sonta',
  password: process.env.DATABASE_PASSWORD || 'sonta_password',
  database: process.env.DATABASE_NAME || 'sonta_attendance',
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/database/migrations/*.js'],
  synchronize: false,
  logging: false,
});
