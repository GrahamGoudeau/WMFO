UPDATE volunteer_hours_t
SET deleted = TRUE
WHERE id = $1 AND deleted = FALSE;
