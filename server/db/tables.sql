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
    'SPRING'
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
    account_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    tufts_id INTEGER DEFAULT NULL CHECK (tufts_id > 0),
    last_agreement_signed INTEGER REFERENCES agreements_t(id) DEFAULT NULL
);

CREATE TABLE show_t (
    id SERIAL PRIMARY KEY,
    show_name VARCHAR(100) CHECK (COALESCE(show_name, '') <> '')
);

CREATE TABLE show_schedule_t (
    id SERIAL PRIMARY KEY,
    show_id INTEGER REFERENCES show_t(id) NOT NULL,
    day_of_week day_of_week_e NOT NULL,
    does_alternate_weeks BOOLEAN NOT NULL,
    hour INTEGER CHECK (hour BETWEEN 0 AND 23),
    semester semester_e NOT NULL,
    year INTEGER CHECK (year > 2000)
);

CREATE TABLE show_request_t (
    id SERIAL PRIMARY KEY,
    show_name VARCHAR(100) CHECK (COALESCE(show_name, '') <> ''),
    day_of_week_requested day_of_week_e ARRAY NOT NULL CHECK (ARRAY_LENGTH(day_of_week_requested, 1) <= 15),
    hours_requested INTEGER ARRAY NOT NULL CHECK (ARRAY_LENGTH(hours_requested, 1) <= 15),
    does_alternate_weeks BOOLEAN NOT NULL,
    semester_show_airs semester_e NOT NULL,
    year_show_airs INTEGER CHECK (year_show_airs > 2000)
);

CREATE TABLE show_request_owner_relation_t (
    id SERIAL PRIMARY KEY,
    dj_id INTEGER REFERENCES community_members_t(id),
    show_request_id INTEGER REFERENCES show_request_t(id)
);

CREATE TABLE show_owner_relation_t (
    id SERIAL PRIMARY KEY,
    community_member_id INTEGER REFERENCES community_members_t(id),
    show_id INTEGER REFERENCES show_t(id),
    UNIQUE(community_member_id, show_id)
);

CREATE TABLE permission_level_t (
    community_member_id INTEGER REFERENCES community_members_t(id),
    permission_level permission_level_e NOT NULL,
    PRIMARY KEY(community_member_id, permission_level)
);

CREATE TABLE volunteer_hours_t (
    id SERIAL PRIMARY KEY,
    created TIMESTAMP NOT NULL DEFAULT NOW(),
    volunteer_date TIMESTAMP NOT NULL,
    num_hours INTEGER CHECK (num_hours > 0),
    description TEXT CHECK (COALESCE(description, '') <> ''),
    confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    community_member_id INTEGER REFERENCES community_members_t(id) NOT NULL
);

CREATE TABLE show_check_in_t (
    id SERIAL PRIMARY KEY,
    check_in_date TIMESTAMP NOT NULL DEFAULT NOW(),
    confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    show_owner_id INTEGER REFERENCES show_owner_relation_t(id) NOT NULL
);
