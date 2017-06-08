SELECT
    id
FROM community_members_t
WHERE email = $1;
