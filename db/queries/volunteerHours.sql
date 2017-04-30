SELECT
    id,
    created,
    volunteer_date,
    num_hours,
    description
FROM volunteer_hours_t
WHERE
    (confirmed = TRUE) AND community_member_id = $1
