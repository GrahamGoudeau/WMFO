UPDATE show_request_t
SET scheduled = NOT scheduled
WHERE id = $1
RETURNING scheduled;
