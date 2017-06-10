SELECT
    email
FROM community_members_t
WHERE id IN ($1:csv);
