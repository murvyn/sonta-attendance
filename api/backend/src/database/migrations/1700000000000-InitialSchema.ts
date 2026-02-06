import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1700000000000 implements MigrationInterface {
    name = 'InitialSchema1700000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Enable required extensions
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

        // Create ENUM types
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "admin_role_enum" AS ENUM ('super_admin', 'admin');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "sonta_head_status_enum" AS ENUM ('active', 'inactive', 'suspended');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "meeting_status_enum" AS ENUM ('scheduled', 'active', 'ended', 'cancelled');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "qr_expiry_strategy_enum" AS ENUM ('until_end', 'max_scans', 'time_based');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "check_in_method_enum" AS ENUM ('facial_recognition', 'manual_admin');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "verification_result_enum" AS ENUM ('success', 'low_confidence', 'rejected', 'liveness_failed', 'outside_geofence');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "pending_verification_status_enum" AS ENUM ('pending', 'approved', 'rejected');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // Create admin_users table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "admin_users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "username" varchar(100) NOT NULL,
                "email" varchar(255) NOT NULL,
                "password_hash" text NOT NULL,
                "full_name" varchar(255),
                "role" "admin_role_enum" NOT NULL DEFAULT 'admin',
                "is_active" boolean NOT NULL DEFAULT true,
                "last_login_at" timestamp,
                "created_at" timestamp NOT NULL DEFAULT now(),
                "updated_at" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_admin_users_username" UNIQUE ("username"),
                CONSTRAINT "UQ_admin_users_email" UNIQUE ("email"),
                CONSTRAINT "PK_admin_users" PRIMARY KEY ("id")
            )
        `);

        // Create sonta_heads table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "sonta_heads" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" varchar(255) NOT NULL,
                "phone" varchar(20) NOT NULL,
                "email" varchar(255),
                "profile_image_url" text NOT NULL,
                "profile_image_path" text,
                "facial_embedding_id" varchar(255),
                "facial_embedding" bytea,
                "status" "sonta_head_status_enum" NOT NULL DEFAULT 'active',
                "enrollment_date" date NOT NULL DEFAULT CURRENT_DATE,
                "notes" text,
                "created_at" timestamp NOT NULL DEFAULT now(),
                "updated_at" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_sonta_heads_phone" UNIQUE ("phone"),
                CONSTRAINT "PK_sonta_heads" PRIMARY KEY ("id")
            )
        `);

        // Create meetings table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "meetings" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "title" varchar(255) NOT NULL,
                "description" text,
                "location_name" varchar(255) NOT NULL,
                "location_address" text,
                "location_latitude" double precision NOT NULL,
                "location_longitude" double precision NOT NULL,
                "geofence_radius_meters" int NOT NULL DEFAULT 100,
                "scheduled_start" timestamp NOT NULL,
                "scheduled_end" timestamp NOT NULL,
                "actual_start" timestamp,
                "actual_end" timestamp,
                "late_arrival_cutoff_minutes" int,
                "qr_expiry_strategy" "qr_expiry_strategy_enum" NOT NULL DEFAULT 'until_end',
                "qr_expiry_minutes" int,
                "qr_max_scans" int,
                "status" "meeting_status_enum" NOT NULL DEFAULT 'scheduled',
                "expected_attendees" int,
                "created_by" uuid,
                "created_at" timestamp NOT NULL DEFAULT now(),
                "updated_at" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "PK_meetings" PRIMARY KEY ("id"),
                CONSTRAINT "FK_meetings_created_by" FOREIGN KEY ("created_by") REFERENCES "admin_users"("id") ON DELETE SET NULL
            )
        `);

        // Create qr_codes table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "qr_codes" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "meeting_id" uuid NOT NULL,
                "qr_token" text NOT NULL,
                "qr_image_url" text,
                "qr_image_path" text,
                "scan_count" int NOT NULL DEFAULT 0,
                "max_scans" int,
                "is_active" boolean NOT NULL DEFAULT true,
                "expires_at" timestamp,
                "invalidated_at" timestamp,
                "invalidated_by" uuid,
                "created_at" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_qr_codes_qr_token" UNIQUE ("qr_token"),
                CONSTRAINT "PK_qr_codes" PRIMARY KEY ("id"),
                CONSTRAINT "FK_qr_codes_meeting_id" FOREIGN KEY ("meeting_id") REFERENCES "meetings"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_qr_codes_invalidated_by" FOREIGN KEY ("invalidated_by") REFERENCES "admin_users"("id") ON DELETE SET NULL
            )
        `);

        // Create attendance table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "attendance" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "meeting_id" uuid NOT NULL,
                "sonta_head_id" uuid NOT NULL,
                "qr_code_id" uuid,
                "check_in_timestamp" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "check_in_method" "check_in_method_enum" NOT NULL,
                "facial_confidence_score" decimal(5,2),
                "is_late" boolean NOT NULL DEFAULT false,
                "verification_attempts" int NOT NULL DEFAULT 1,
                "is_suspicious" boolean NOT NULL DEFAULT false,
                "check_in_latitude" double precision,
                "check_in_longitude" double precision,
                "device_info" jsonb,
                "checked_in_by_admin" uuid,
                "notes" text,
                "created_at" timestamp NOT NULL DEFAULT now(),
                "updated_at" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_attendance_meeting_sonta_head" UNIQUE ("meeting_id", "sonta_head_id"),
                CONSTRAINT "PK_attendance" PRIMARY KEY ("id"),
                CONSTRAINT "FK_attendance_meeting_id" FOREIGN KEY ("meeting_id") REFERENCES "meetings"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_attendance_sonta_head_id" FOREIGN KEY ("sonta_head_id") REFERENCES "sonta_heads"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_attendance_checked_in_by_admin" FOREIGN KEY ("checked_in_by_admin") REFERENCES "admin_users"("id") ON DELETE SET NULL
            )
        `);

        // Create verification_attempts table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "verification_attempts" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "meeting_id" uuid NOT NULL,
                "sonta_head_id" uuid,
                "qr_code_id" uuid,
                "attempt_timestamp" timestamp NOT NULL DEFAULT now(),
                "facial_confidence_score" decimal(5,2),
                "result" "verification_result_enum" NOT NULL,
                "captured_image_url" text,
                "captured_image_path" text,
                "check_in_latitude" double precision,
                "check_in_longitude" double precision,
                "device_info" jsonb,
                "error_message" text,
                CONSTRAINT "PK_verification_attempts" PRIMARY KEY ("id"),
                CONSTRAINT "FK_verification_attempts_meeting_id" FOREIGN KEY ("meeting_id") REFERENCES "meetings"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_verification_attempts_sonta_head_id" FOREIGN KEY ("sonta_head_id") REFERENCES "sonta_heads"("id") ON DELETE SET NULL
            )
        `);

        // Create pending_verifications table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "pending_verifications" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "meeting_id" uuid NOT NULL,
                "sonta_head_id" uuid NOT NULL,
                "qr_code_id" uuid,
                "captured_image_url" text NOT NULL,
                "captured_image_path" text,
                "profile_image_url" text NOT NULL,
                "facial_confidence_score" decimal(5,2),
                "check_in_latitude" double precision,
                "check_in_longitude" double precision,
                "device_info" jsonb,
                "status" "pending_verification_status_enum" NOT NULL DEFAULT 'pending',
                "reviewed_by" uuid,
                "reviewed_at" timestamp,
                "review_notes" text,
                "created_at" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "PK_pending_verifications" PRIMARY KEY ("id"),
                CONSTRAINT "FK_pending_verifications_meeting_id" FOREIGN KEY ("meeting_id") REFERENCES "meetings"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_pending_verifications_sonta_head_id" FOREIGN KEY ("sonta_head_id") REFERENCES "sonta_heads"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_pending_verifications_reviewed_by" FOREIGN KEY ("reviewed_by") REFERENCES "admin_users"("id") ON DELETE SET NULL
            )
        `);

        // Create audit_log table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "audit_log" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "admin_id" uuid,
                "action" varchar(255) NOT NULL,
                "entity_type" varchar(100),
                "entity_id" uuid,
                "old_values" jsonb,
                "new_values" jsonb,
                "ip_address" inet,
                "user_agent" text,
                "timestamp" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "PK_audit_log" PRIMARY KEY ("id"),
                CONSTRAINT "FK_audit_log_admin_id" FOREIGN KEY ("admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL
            )
        `);

        console.log('Initial schema migration completed successfully');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop tables in reverse order (respecting foreign key dependencies)
        await queryRunner.query(`DROP TABLE IF EXISTS "audit_log"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "pending_verifications"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "verification_attempts"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "attendance"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "qr_codes"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "meetings"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "sonta_heads"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "admin_users"`);

        // Drop ENUM types
        await queryRunner.query(`DROP TYPE IF EXISTS "pending_verification_status_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "verification_result_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "check_in_method_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "qr_expiry_strategy_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "meeting_status_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "sonta_head_status_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "admin_role_enum"`);
    }
}
