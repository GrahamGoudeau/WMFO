/*
 * $1 show id
 * $2 day of week
 * $3 does alternate
 * $4 hour
 * $5 semester
 * $6 year
 */
INSERT INTO show_schedule_t
VALUES (DEFAULT, $1, $2, $3, $4, $5, $6)
RETURNING id;
