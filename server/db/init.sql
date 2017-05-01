DROP DATABASE IF EXISTS wmfo_db;
CREATE DATABASE wmfo_db;

\c wmfo_db;

/* create the tables */
\i tables.sql

INSERT INTO community_members_t VALUES (DEFAULT, 'Graham', 'Goudeau', 'grahamgoudeau@gmail.com', '2c01ae70ec30a3c80bd69453771d5ad3592155d06a99c26d77ac52b0383be452adb4b1e0ce553d2460cf83a37fb992187f5692e86a1703cb1fd7b3687fd039e3', DEFAULT);
INSERT INTO permission_level_t VALUES (
    (SELECT id FROM community_members_t WHERE email='grahamgoudeau@gmail.com'),
    'WEBMASTER'
);
