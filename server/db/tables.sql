CREATE TYPE permission_level_e AS ENUM (
    'STUDENT_DJ',
    'COMMUNITY_DJ',
    'GENERAL_MANAGER',
    'ASSISTANT_GENERAL_MANAGER',
    'OPERATIONS_DIRECTOR',
    'PROGRAMMING_DIRECTOR',
    'SCHEDULING_COORDINATOR',
    'VOLUNTEER_COORDINATOR',
    'WEBMASTER'
);

CREATE TYPE day_of_week_e AS ENUM (
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
    'SUNDAY'
);

CREATE TYPE semester_e AS ENUM (
    'FALL',
    'SPRING',
    'SUMMER'
);

/* show forms between agreement posted and due date we set */
CREATE TABLE agreements_t (
    agreement_text TEXT CHECK (COALESCE(agreement_text, '') <> ''),
    date_created TIMESTAMP NOT NULL DEFAULT NOW(),
    id SERIAL PRIMARY KEY
);

CREATE TABLE community_members_t (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) CHECK (COALESCE(first_name, '') <> ''),
    last_name VARCHAR(100) CHECK (COALESCE(last_name, '') <> ''),
    email VARCHAR(100) UNIQUE CHECK (COALESCE(email, '') <> ''),
    password_hash VARCHAR(128) CHECK (COALESCE(password_hash, '') <> ''),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    tufts_id INTEGER DEFAULT NULL CHECK (tufts_id > 0),
    last_agreement_signed INTEGER REFERENCES agreements_t(id) DEFAULT NULL
);

CREATE TABLE dj_name_t (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) CHECK (COALESCE(name, '') <> ''),
    community_member_id INTEGER REFERENCES community_members_t(id) NOT NULL
);

CREATE TABLE show_t (
    id SERIAL PRIMARY KEY,
    show_name VARCHAR(100) CHECK (COALESCE(show_name, '') <> ''),
    date_created TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE show_schedule_t (
    id SERIAL PRIMARY KEY,
    show_id INTEGER REFERENCES show_t(id) ON DELETE CASCADE NOT NULL,
    day_of_week day_of_week_e NOT NULL,
    does_alternate_weeks BOOLEAN NOT NULL,
    hour INTEGER CHECK (hour BETWEEN 0 AND 23),
    semester semester_e NOT NULL,
    year INTEGER CHECK (year > 2000)
);

CREATE TABLE show_request_t (
    id SERIAL PRIMARY KEY,
    date_created TIMESTAMP NOT NULL DEFAULT NOW(),
    show_name VARCHAR(100) CHECK (COALESCE(show_name, '') <> ''),
    day_of_week_requested day_of_week_e ARRAY NOT NULL CHECK (ARRAY_LENGTH(day_of_week_requested, 1) <= 15),
    hours_requested INTEGER ARRAY NOT NULL CHECK (ARRAY_LENGTH(hours_requested, 1) <= 15),
    does_alternate_weeks BOOLEAN NOT NULL,
    semester_show_airs semester_e NOT NULL,
    year_show_airs INTEGER CHECK (year_show_airs > 2000),
    scheduled BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE show_request_owner_relation_t (
    id SERIAL PRIMARY KEY,
    dj_id INTEGER REFERENCES community_members_t(id),
    show_request_id INTEGER REFERENCES show_request_t(id) ON DELETE CASCADE
);

CREATE TABLE show_owner_relation_t (
    id SERIAL PRIMARY KEY,
    community_member_id INTEGER REFERENCES community_members_t(id),
    show_id INTEGER REFERENCES show_t(id) ON DELETE CASCADE
);

CREATE VIEW show_request_info_v AS (
    SELECT
        sr.id,
        sr.scheduled,
        sr.date_created,
        sr.show_name,
        ARRAY_TO_JSON(sr.day_of_week_requested) AS day_of_week_requested,
        ARRAY_TO_JSON(sr.hours_requested) AS hours_requested,
        sr.does_alternate_weeks,
        sr.semester_show_airs,
        sr.year_show_airs,
        cmi.community_member_ids,
        cmi.community_member_emails
    FROM show_request_t sr
    JOIN (
        SELECT
            sr.id,
            ARRAY_TO_JSON(ARRAY_AGG(sror.dj_id)) AS community_member_ids,
            ARRAY_TO_JSON(ARRAY_AGG(cm.email)) as community_member_emails
        FROM show_request_owner_relation_t sror
        JOIN show_request_t sr ON sr.id = sror.show_request_id
        JOIN community_members_t cm ON cm.id = sror.dj_id
        GROUP BY sr.id
    ) cmi ON cmi.id = sr.id
);

CREATE VIEW show_info_v AS (
    SELECT
        show.id,
        show.date_created,
        show.show_name,
        sched.day_of_week,
        sched.does_alternate_weeks,
        sched.hour,
        sched.semester,
        sched.year,
        emails.community_member_emails,
        emails.community_member_ids
    FROM show_schedule_t sched
    JOIN show_t show ON sched.id = show.id
    JOIN (
        SELECT
            show.id AS show_id,
            ARRAY_TO_JSON(ARRAY_AGG(cm.email)) AS community_member_emails,
            ARRAY_TO_JSON(ARRAY_AGG(cm.id)) AS community_member_ids
        FROM show_owner_relation_t sor
        JOIN show_t show ON show.id = sor.show_id
        JOIN community_members_t cm ON cm.id = sor.community_member_id
        GROUP BY show.id
    ) emails ON emails.show_id = show.id
);

CREATE TABLE permission_level_t (
    community_member_id INTEGER REFERENCES community_members_t(id),
    permission_level permission_level_e NOT NULL,
    PRIMARY KEY(community_member_id, permission_level)
);

CREATE TABLE pending_community_members_t (
    email VARCHAR(100) PRIMARY KEY CHECK (COALESCE(email, '') <> ''),
    code UUID UNIQUE NOT NULL DEFAULT UUID_GENERATE_V4(),
    claimed BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE OR REPLACE FUNCTION check_member_not_already_exist()
    RETURNS trigger AS
$BODY$
BEGIN
    IF NEW.email = (SELECT email FROM community_members_t WHERE email=NEW.email) THEN
        RAISE EXCEPTION 'Pending member duplicate';
    END IF;

    RETURN NEW;
END;
$BODY$
LANGUAGE 'plpgsql';

CREATE TRIGGER check_new_member
BEFORE INSERT
ON pending_community_members_t
FOR EACH ROW
EXECUTE PROCEDURE check_member_not_already_exist();

CREATE TABLE pending_members_permissions_t (
    pending_community_members_email VARCHAR(100) REFERENCES pending_community_members_t(email) ON DELETE CASCADE,
    permission_level permission_level_e NOT NULL,
    PRIMARY KEY(pending_community_members_email, permission_level)
);

CREATE VIEW pending_members_with_permissions_v AS (
    SELECT
        pcm.email,
        pcm.code,
        ARRAY_TO_JSON(ARRAY_AGG(pmp.permission_level)) AS permission_levels
    FROM pending_community_members_t pcm
    LEFT JOIN pending_members_permissions_t pmp ON pmp.pending_community_members_email = pcm.email
    WHERE pcm.claimed = FALSE
    GROUP BY pcm.email);

CREATE TABLE volunteer_hours_t (
    id SERIAL PRIMARY KEY,
    created TIMESTAMP NOT NULL DEFAULT NOW(),
    volunteer_date TIMESTAMP NOT NULL,
    num_hours REAL CHECK (num_hours > 0),
    description TEXT CHECK (COALESCE(description, '') <> ''),
    confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    community_member_id INTEGER REFERENCES community_members_t(id) NOT NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    semester semester_e NOT NULL,
    year INTEGER NOT NULL CHECK (year > 2000)
);

CREATE VIEW all_user_info_v AS (
    SELECT
        cm.id,
        cm.first_name,
        cm.last_name,
        cm.email,
        cm.active,
        cm.tufts_id,
        las.id AS last_agreement_signed,
        las.date_created AS date_last_agreement_signed,
        pl.permission_levels,
        COALESCE(cvh.confirmed_volunteer_hours, 0) AS confirmed_volunteer_hours,
        COALESCE(pvh.pending_volunteer_hours, 0) AS pending_volunteer_hours,
        COALESCE(sor.num_shows_hosted, 0) AS num_shows_hosted
    FROM community_members_t cm
    LEFT JOIN agreements_t las ON las.id = cm.last_agreement_signed
    LEFT JOIN (
        SELECT
            community_member_id,
            COUNT(id) as num_shows_hosted
        FROM show_owner_relation_t
        GROUP BY community_member_id
    ) sor ON sor.community_member_id = cm.id
    LEFT JOIN (
        SELECT
            community_member_id,
            SUM(num_hours) as confirmed_volunteer_hours
        FROM volunteer_hours_t
        WHERE confirmed = TRUE
        GROUP BY community_member_id
    ) cvh ON cvh.community_member_id = cm.id
    LEFT JOIN (
        SELECT
            community_member_id,
            SUM(num_hours) as pending_volunteer_hours
        FROM volunteer_hours_t
        WHERE confirmed = FALSE
        GROUP BY community_member_id
    ) pvh on pvh.community_member_id = cm.id
    LEFT JOIN (
        SELECT
            community_member_id,
            ARRAY_TO_JSON(ARRAY_AGG(permission_level)) as permission_levels
        FROM permission_level_t
        GROUP BY community_member_id
    ) pl on pl.community_member_id = cm.id
);

CREATE TABLE show_check_in_t (
    id SERIAL PRIMARY KEY,
    check_in_date TIMESTAMP NOT NULL DEFAULT NOW(),
    confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    show_owner_id INTEGER REFERENCES show_owner_relation_t(id) NOT NULL
);
