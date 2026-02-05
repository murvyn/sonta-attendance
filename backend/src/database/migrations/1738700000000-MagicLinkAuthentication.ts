import { MigrationInterface, QueryRunner } from 'typeorm';

export class MagicLinkAuthentication1738700000000 implements MigrationInterface {
  name = 'MagicLinkAuthentication1738700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create magic_link_tokens table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "magic_link_tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "token" varchar(64) NOT NULL,
        "admin_id" uuid NOT NULL,
        "expires_at" timestamp NOT NULL,
        "is_used" boolean NOT NULL DEFAULT false,
        "used_at" timestamp,
        "created_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_magic_link_tokens_token" UNIQUE ("token"),
        CONSTRAINT "PK_magic_link_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "FK_magic_link_tokens_admin_id" FOREIGN KEY ("admin_id") REFERENCES "admin_users"("id") ON DELETE CASCADE
      )
    `);

    // Create index for token lookup
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_magic_link_tokens_token" ON "magic_link_tokens" ("token")
    `);

    // Create index for cleanup of expired tokens
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_magic_link_tokens_expires_at" ON "magic_link_tokens" ("expires_at")
    `);

    // Make password_hash nullable (existing users still have passwords during transition)
    await queryRunner.query(`
      ALTER TABLE "admin_users" ALTER COLUMN "password_hash" DROP NOT NULL
    `);

    // Remove username column (no longer needed - using email for login)
    await queryRunner.query(`
      ALTER TABLE "admin_users" DROP CONSTRAINT IF EXISTS "UQ_admin_users_username"
    `);
    await queryRunner.query(`
      ALTER TABLE "admin_users" DROP COLUMN IF EXISTS "username"
    `);

    console.log('Magic link authentication migration completed');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Add back username column
    await queryRunner.query(`
      ALTER TABLE "admin_users" ADD COLUMN IF NOT EXISTS "username" varchar(100)
    `);

    // Drop indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_magic_link_tokens_expires_at"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_magic_link_tokens_token"`,
    );

    // Drop magic_link_tokens table
    await queryRunner.query(`DROP TABLE IF EXISTS "magic_link_tokens"`);
  }
}
