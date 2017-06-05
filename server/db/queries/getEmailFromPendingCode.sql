SELECT
    email
FROM pending_community_members_t
WHERE code = $1 AND claimed = FALSE;
