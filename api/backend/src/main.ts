import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module';

async function seedSuperAdmin(dataSource: DataSource) {
  const email = process.env.SUPER_ADMIN_EMAIL;
  if (!email) return;

  const [existing] = await dataSource.query(
    'SELECT id FROM admin_users WHERE email = $1',
    [email],
  );
  if (existing) return;

  await dataSource.query(
    `INSERT INTO admin_users (email, full_name, role, is_active)
     VALUES ($1, $2, 'super_admin', true)`,
    [email, email.split('@')[0]],
  );
  console.log(`[Seed] Super admin created: ${email}`);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: true, // Allow all origins for development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'ngrok-skip-browser-warning',
    ],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Sonta Attendance API')
    .setDescription('API for Sonta Head Attendance Verification System')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Seed super admin after migrations have run
  const dataSource = app.get(DataSource);
  await seedSuperAdmin(dataSource);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application running on: http://localhost:${port}`);
  console.log(`Swagger docs available at: http://localhost:${port}/api/docs`);
}
bootstrap();
