/*
 * $1 - show name
 * $2 - day of week array
 * $3 - hours array
 * $4 - does alternate weeks
 * $5 - semester show airs
 * $6 - year show airs
 */
INSERT INTO show_request_t
VALUES (DEFAULT, $1, $2::day_of_week_e[], $3, $4, $5, $6)
RETURNING id;
