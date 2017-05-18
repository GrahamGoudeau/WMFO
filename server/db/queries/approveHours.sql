UPDATE volunteer_hours_t
SET confirmed = TRUE
WHERE id = $1 AND deleted = FALSE;
