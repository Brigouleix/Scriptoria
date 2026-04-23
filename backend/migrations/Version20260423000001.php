<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Migration initiale — Scriptoria
 * Crée les tables : user, project, snowflake_step, person, character_link, location, chapter
 */
final class Version20260423000001 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Schéma initial Scriptoria';
    }

    public function up(Schema $schema): void
    {
        // ── Users ────────────────────────────────────────────────
        $this->addSql('CREATE TABLE "user" (
            id         UUID        NOT NULL,
            email      VARCHAR(180) NOT NULL,
            roles      JSON        NOT NULL,
            password   VARCHAR(255) NOT NULL,
            created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
            updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
            PRIMARY KEY(id)
        )');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_8D93D649E7927C74 ON "user" (email)');
        $this->addSql('COMMENT ON COLUMN "user".id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN "user".created_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('COMMENT ON COLUMN "user".updated_at IS \'(DC2Type:datetime_immutable)\'');

        // ── Projects ─────────────────────────────────────────────
        $this->addSql('CREATE TABLE project (
            id           UUID         NOT NULL,
            user_id      UUID         NOT NULL,
            title        VARCHAR(255) NOT NULL,
            genre        VARCHAR(100) DEFAULT NULL,
            project_type VARCHAR(10)  NOT NULL DEFAULT \'novel\',
            cover_url    VARCHAR(500) DEFAULT NULL,
            created_at   TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
            updated_at   TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
            PRIMARY KEY(id)
        )');
        $this->addSql('CREATE INDEX IDX_2FB3D0EEA76ED395 ON project (user_id)');
        $this->addSql('ALTER TABLE project ADD CONSTRAINT FK_project_user FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('COMMENT ON COLUMN project.id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN project.user_id IS \'(DC2Type:uuid)\'');

        // ── Snowflake Steps ──────────────────────────────────────
        $this->addSql('CREATE TABLE snowflake_step (
            id          UUID     NOT NULL,
            project_id  UUID     NOT NULL,
            step_number SMALLINT NOT NULL,
            content     TEXT     DEFAULT NULL,
            updated_at  TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
            PRIMARY KEY(id)
        )');
        $this->addSql('CREATE INDEX IDX_snowflake_project ON snowflake_step (project_id)');
        $this->addSql('ALTER TABLE snowflake_step ADD CONSTRAINT FK_snowflake_project FOREIGN KEY (project_id) REFERENCES project (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('COMMENT ON COLUMN snowflake_step.id IS \'(DC2Type:uuid)\'');

        // ── People (Personnages) ─────────────────────────────────
        $this->addSql('CREATE TABLE person (
            id         UUID         NOT NULL,
            user_id    UUID         NOT NULL,
            name       VARCHAR(255) NOT NULL,
            bio        TEXT         DEFAULT NULL,
            avatar_url VARCHAR(500) DEFAULT NULL,
            created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
            PRIMARY KEY(id)
        )');
        $this->addSql('CREATE INDEX IDX_person_user ON person (user_id)');
        $this->addSql('ALTER TABLE person ADD CONSTRAINT FK_person_user FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');

        // ── Character Links ──────────────────────────────────────
        $this->addSql('CREATE TABLE character_link (
            id           UUID         NOT NULL,
            user_id      UUID         NOT NULL,
            person_a_id  UUID         NOT NULL,
            person_b_id  UUID         NOT NULL,
            relationship VARCHAR(255) DEFAULT NULL,
            PRIMARY KEY(id),
            CONSTRAINT unique_link UNIQUE (person_a_id, person_b_id)
        )');
        $this->addSql('ALTER TABLE character_link ADD CONSTRAINT FK_link_user    FOREIGN KEY (user_id)     REFERENCES "user"  (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE character_link ADD CONSTRAINT FK_link_personA FOREIGN KEY (person_a_id) REFERENCES person  (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE character_link ADD CONSTRAINT FK_link_personB FOREIGN KEY (person_b_id) REFERENCES person  (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');

        // ── Locations ────────────────────────────────────────────
        $this->addSql('CREATE TABLE location (
            id          UUID         NOT NULL,
            user_id     UUID         NOT NULL,
            name        VARCHAR(255) NOT NULL,
            description TEXT         DEFAULT NULL,
            created_at  TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
            PRIMARY KEY(id)
        )');
        $this->addSql('CREATE INDEX IDX_location_user ON location (user_id)');
        $this->addSql('ALTER TABLE location ADD CONSTRAINT FK_location_user FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');

        // ── Chapters ─────────────────────────────────────────────
        $this->addSql('CREATE TABLE chapter (
            id          UUID         NOT NULL,
            project_id  UUID         NOT NULL,
            user_id     UUID         NOT NULL,
            title       VARCHAR(255) NOT NULL,
            description TEXT         DEFAULT NULL,
            order_index INTEGER      NOT NULL DEFAULT 0,
            created_at  TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
            PRIMARY KEY(id)
        )');
        $this->addSql('CREATE INDEX IDX_chapter_project ON chapter (project_id)');
        $this->addSql('ALTER TABLE chapter ADD CONSTRAINT FK_chapter_project FOREIGN KEY (project_id) REFERENCES project (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE chapter ADD CONSTRAINT FK_chapter_user    FOREIGN KEY (user_id)    REFERENCES "user"  (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE chapter         DROP CONSTRAINT FK_chapter_project');
        $this->addSql('ALTER TABLE chapter         DROP CONSTRAINT FK_chapter_user');
        $this->addSql('ALTER TABLE character_link  DROP CONSTRAINT FK_link_user');
        $this->addSql('ALTER TABLE character_link  DROP CONSTRAINT FK_link_personA');
        $this->addSql('ALTER TABLE character_link  DROP CONSTRAINT FK_link_personB');
        $this->addSql('ALTER TABLE location        DROP CONSTRAINT FK_location_user');
        $this->addSql('ALTER TABLE person          DROP CONSTRAINT FK_person_user');
        $this->addSql('ALTER TABLE snowflake_step  DROP CONSTRAINT FK_snowflake_project');
        $this->addSql('ALTER TABLE project         DROP CONSTRAINT FK_project_user');
        $this->addSql('DROP TABLE chapter');
        $this->addSql('DROP TABLE character_link');
        $this->addSql('DROP TABLE location');
        $this->addSql('DROP TABLE person');
        $this->addSql('DROP TABLE snowflake_step');
        $this->addSql('DROP TABLE project');
        $this->addSql('DROP TABLE "user"');
    }
}
