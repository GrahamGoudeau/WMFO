/*
 * $1 - volunteer_date TIMESTAMP
 * $2 - num_hours INTEGER
 * $3 - description TEXT
 * $4 - community_member_id
 */
INSERT INTO volunteer_hours_t
VALUES (DEFAULT, DEFAULT, $1, $2, $3, DEFAULT, $4, DEFAULT);
