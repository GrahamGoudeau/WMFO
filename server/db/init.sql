DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
COMMENT ON SCHEMA public IS 'standard public schema';

/* for UUID generation */
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
/* usage: uuid_generate_v4() */

/* create the tables */
\i tables.sql

INSERT INTO community_members_t VALUES
    (DEFAULT, 'Graham', 'Goudeau', 'grahamgoudeau@gmail.com', '2c01ae70ec30a3c80bd69453771d5ad3592155d06a99c26d77ac52b0383be452adb4b1e0ce553d2460cf83a37fb992187f5692e86a1703cb1fd7b3687fd039e3', DEFAULT, DEFAULT, DEFAULT),
    (DEFAULT, 'GM', 'WMFO', 'gm@wmfo.org', '8687ee49701e46f309a1d2277a38708607700c63e07eab37f15aad7dfba639d27616550566492d519e47187cf7f8991bae0f39ea37072f34bd418d9d8a8dce64', DEFAULT, DEFAULT, DEFAULT),
    (DEFAULT, 'AGM', 'WMFO', 'agm@wmfo.org', 'd32af0b57ad5b7433442ac735e9f08ec9ce9cee082082c09ebe9a94f93ddeb440ecc1dfd8313c8ec9257f833953448f5752e9f5cb408b7ceace736c964d68f0f', DEFAULT, DEFAULT, DEFAULT),
    (DEFAULT, 'PD', 'WMFO', 'pd@wmfo.org', 'ecb7354635969faf5e804730f1018dee986008f345ea61f6e11de988d262601878c552880f6864d4777e58f8bdbe05e1c85717e896d1512429390e7fab641fc6', DEFAULT, DEFAULT, DEFAULT),
    (DEFAULT, 'OPS', 'WMFO', 'ops@wmfo.org', 'd11403cae4d046ff1f506dee60fbda1798bb08fb9b6ccdf26bc02833dd48868d91f4d57cc4249e3229ce12baf6d66e920f692714f9b0e139bf2e3633569d204a', DEFAULT, DEFAULT, DEFAULT),
    (DEFAULT, 'test dj first name', 'test dj last name', 'testdj@test.edu', '343ff3c6ba8a1374207a97c42966e0c17852e75dd51815e982611d4090ade632151ea79129bf45f7054ab83401478d29a64bec9a47197a924967595e6b4ae4c7', TRUE, NULL, NULL)
;

INSERT INTO permission_level_t
VALUES
    ((SELECT id FROM community_members_t WHERE email='grahamgoudeau@gmail.com'), 'WEBMASTER'),
    ((SELECT id FROM community_members_t WHERE email='gm@wmfo.org'), 'GENERAL_MANAGER'),
    ((SELECT id FROM community_members_t WHERE email='agm@wmfo.org'), 'ASSISTANT_GENERAL_MANAGER'),
    ((SELECT id FROM community_members_t WHERE email='pd@wmfo.org'), 'PROGRAMMING_DIRECTOR'),
    ((SELECT id FROM community_members_t WHERE email='ops@wmfo.org'), 'OPERATIONS_DIRECTOR'),
    ((SELECT id FROM community_members_t WHERE email='testdj@test.edu'), 'COMMUNITY_DJ')
;

INSERT INTO agreements_t
VALUES ('I will follow the rules laid out by WMFO and follow the policies set forth by the FCC and the WMFO station.  I understand that violation of any guidelines set forth by any applicable organization is punishable at the discretion of the WMFO Executive Board.  I also agree to continue to abide by the guidelines presented to me during the WMFO DJ training.', DEFAULT, DEFAULT);
