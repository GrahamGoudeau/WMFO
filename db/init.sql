DROP DATABASE IF EXISTS wmfo_db;
CREATE DATABASE wmfo_db;

\c wmfo_db;

/* create the tables */
\i tables.sql

INSERT INTO community_members_t VALUES (DEFAULT, 'Graham', 'Goudeau', 'grahamgoudeau@gmail.com', DEFAULT);
INSERT INTO permission_level_t VALUES (
    (SELECT id FROM community_members_t WHERE email='grahamgoudeau@gmail.com'),
    'WEBMASTER'
);
