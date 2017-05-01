SET ROLE postgres;
DROP DATABASE IF EXISTS wmfo_db;
CREATE DATABASE wmfo_db;

\c wmfo_db;
SET ROLE postgres;

/* create the tables */
\i tables.sql

INSERT INTO community_members_t VALUES
    (DEFAULT, 'Graham', 'Goudeau', 'grahamgoudeau@gmail.com', '2c01ae70ec30a3c80bd69453771d5ad3592155d06a99c26d77ac52b0383be452adb4b1e0ce553d2460cf83a37fb992187f5692e86a1703cb1fd7b3687fd039e3', DEFAULT),
    (DEFAULT, 'GM', 'WMFO', 'gm@wmfo.org', '8687ee49701e46f309a1d2277a38708607700c63e07eab37f15aad7dfba639d27616550566492d519e47187cf7f8991bae0f39ea37072f34bd418d9d8a8dce64', DEFAULT),
    (DEFAULT, 'AGM', 'WMFO', 'agm@wmfo.org', 'd32af0b57ad5b7433442ac735e9f08ec9ce9cee082082c09ebe9a94f93ddeb440ecc1dfd8313c8ec9257f833953448f5752e9f5cb408b7ceace736c964d68f0f', DEFAULT),
    (DEFAULT, 'PD', 'WMFO', 'pd@wmfo.org', 'ecb7354635969faf5e804730f1018dee986008f345ea61f6e11de988d262601878c552880f6864d4777e58f8bdbe05e1c85717e896d1512429390e7fab641fc6', DEFAULT),
    (DEFAULT, 'OPS', 'WMFO', 'ops@wmfo.org', 'd11403cae4d046ff1f506dee60fbda1798bb08fb9b6ccdf26bc02833dd48868d91f4d57cc4249e3229ce12baf6d66e920f692714f9b0e139bf2e3633569d204a', DEFAULT)
;

INSERT INTO permission_level_t
VALUES
    ((SELECT id FROM community_members_t WHERE email='grahamgoudeau@gmail.com'), 'WEBMASTER'),
    ((SELECT id FROM community_members_t WHERE email='gm@wmfo.org'), 'GENERAL_MANAGER'),
    ((SELECT id FROM community_members_t WHERE email='agm@wmfo.org'), 'ASSISTANT_GENERAL_MANAGER'),
    ((SELECT id FROM community_members_t WHERE email='pd@wmfo.org'), 'PROGRAMMING_DIRECTOR'),
    ((SELECT id FROM community_members_t WHERE email='ops@wmfo.org'), 'OPERATIONS_DIRECTOR')
;
