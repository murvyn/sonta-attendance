import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSontaNameToSontaHeads1770071200000 implements MigrationInterface {
  name = 'AddSontaNameToSontaHeads1770071200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sonta_heads" ADD COLUMN "sonta_name" varchar(255) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sonta_heads" DROP COLUMN "sonta_name"`,
    );
  }
}
