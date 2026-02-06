import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIndexesAndPostGIS1770071186252 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Enable PostGIS extension
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS postgis`);

        // Create PostGIS geofence validation function
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION validate_geofence(
                meeting_lat DOUBLE PRECISION,
                meeting_lng DOUBLE PRECISION,
                checkin_lat DOUBLE PRECISION,
                checkin_lng DOUBLE PRECISION,
                radius_meters INTEGER
            ) RETURNS BOOLEAN AS $$
            BEGIN
                RETURN ST_DWithin(
                    ST_MakePoint(meeting_lng, meeting_lat)::geography,
                    ST_MakePoint(checkin_lng, checkin_lat)::geography,
                    radius_meters
                );
            END;
            $$ LANGUAGE plpgsql IMMUTABLE;
        `);

        // Add indexes for performance

        // Admin Users indexes
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_admin_users_email" ON "admin_users" ("email")`);

        // Sonta Heads indexes
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_sonta_heads_email" ON "sonta_heads" ("email")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_sonta_heads_phone" ON "sonta_heads" ("phone")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_sonta_heads_status" ON "sonta_heads" ("status")`);

        // Meetings indexes
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_meetings_status" ON "meetings" ("status")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_meetings_scheduled_start" ON "meetings" ("scheduled_start")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_meetings_created_by" ON "meetings" ("created_by")`);

        // QR Codes indexes
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_qr_codes_meeting_id" ON "qr_codes" ("meeting_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_qr_codes_qr_token" ON "qr_codes" ("qr_token")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_qr_codes_expires_at" ON "qr_codes" ("expires_at")`);

        // Attendance indexes
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_attendance_meeting_id" ON "attendance" ("meeting_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_attendance_sonta_head_id" ON "attendance" ("sonta_head_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_attendance_check_in_timestamp" ON "attendance" ("check_in_timestamp")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_attendance_check_in_method" ON "attendance" ("check_in_method")`);

        // Verification Attempts indexes
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_verification_attempts_meeting_id" ON "verification_attempts" ("meeting_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_verification_attempts_sonta_head_id" ON "verification_attempts" ("sonta_head_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_verification_attempts_timestamp" ON "verification_attempts" ("attempt_timestamp")`);

        // Pending Verifications indexes
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_pending_verifications_meeting_id" ON "pending_verifications" ("meeting_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_pending_verifications_sonta_head_id" ON "pending_verifications" ("sonta_head_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_pending_verifications_status" ON "pending_verifications" ("status")`);

        // Audit Log indexes
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_audit_log_admin_id" ON "audit_log" ("admin_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_audit_log_action" ON "audit_log" ("action")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_audit_log_timestamp" ON "audit_log" ("timestamp")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_admin_users_email"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_sonta_heads_email"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_sonta_heads_phone"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_sonta_heads_status"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_meetings_status"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_meetings_scheduled_start"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_meetings_created_by"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_qr_codes_meeting_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_qr_codes_qr_token"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_qr_codes_expires_at"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_attendance_meeting_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_attendance_sonta_head_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_attendance_check_in_timestamp"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_attendance_check_in_method"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_verification_attempts_meeting_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_verification_attempts_sonta_head_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_verification_attempts_timestamp"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_pending_verifications_meeting_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_pending_verifications_sonta_head_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_pending_verifications_status"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_audit_log_admin_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_audit_log_action"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_audit_log_timestamp"`);

        // Drop PostGIS function
        await queryRunner.query(`DROP FUNCTION IF EXISTS validate_geofence`);
    }

}
