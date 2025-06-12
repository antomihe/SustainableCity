import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInitialTables1749720613087 implements MigrationInterface {
    name = 'CreateInitialTables1749720613087'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('Student', 'Admin', 'Operator')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(255) NOT NULL, "password" character varying, "name" character varying(255) NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'Student', "isActive" boolean NOT NULL DEFAULT true, "password_reset_expires" TIMESTAMP WITH TIME ZONE, "requires_password_set" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
        await queryRunner.query(`CREATE TABLE "subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "language" character varying(10) NOT NULL DEFAULT 'es', "subscribed_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_f0558bf43d14f66844255e8b7c2" UNIQUE ("email"), CONSTRAINT "PK_a87248d73155605cf782be9ee5e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_f0558bf43d14f66844255e8b7c" ON "subscriptions" ("email") `);
        await queryRunner.query(`CREATE TYPE "public"."containers_type_enum" AS ENUM('GENERAL', 'PAPER', 'PLASTIC', 'GLASS', 'ORGANIC', 'METAL', 'ELECTRONICS', 'BATTERIES', 'CLOTHING', 'OIL', 'OTHERS')`);
        await queryRunner.query(`CREATE TYPE "public"."containers_status_enum" AS ENUM('OK', 'FULL', 'DAMAGED')`);
        await queryRunner.query(`CREATE TABLE "containers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "location" character varying NOT NULL, "coordinates" jsonb NOT NULL, "capacity" integer NOT NULL DEFAULT '100', "fillLevel" integer NOT NULL DEFAULT '0', "type" "public"."containers_type_enum" NOT NULL, "status" "public"."containers_status_enum" NOT NULL DEFAULT 'OK', "incidentDescription" text, "last_emptied_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_21cbac3e68f7b1cf53d39cda70c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "operator_assignments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "operator_id" uuid NOT NULL, "container_id" uuid NOT NULL, "assigned_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_06e20d1f8fcd3bcaf29b6c48af1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_ac8ceab521323d88341a74eb42" ON "operator_assignments" ("operator_id", "container_id") `);
        await queryRunner.query(`ALTER TABLE "operator_assignments" ADD CONSTRAINT "FK_31f5fae35c147cb2097169929ee" FOREIGN KEY ("operator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "operator_assignments" ADD CONSTRAINT "FK_71a1ea672f0492164b9ea77ecb0" FOREIGN KEY ("container_id") REFERENCES "containers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "operator_assignments" DROP CONSTRAINT "FK_71a1ea672f0492164b9ea77ecb0"`);
        await queryRunner.query(`ALTER TABLE "operator_assignments" DROP CONSTRAINT "FK_31f5fae35c147cb2097169929ee"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ac8ceab521323d88341a74eb42"`);
        await queryRunner.query(`DROP TABLE "operator_assignments"`);
        await queryRunner.query(`DROP TABLE "containers"`);
        await queryRunner.query(`DROP TYPE "public"."containers_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."containers_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f0558bf43d14f66844255e8b7c"`);
        await queryRunner.query(`DROP TABLE "subscriptions"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }

}
