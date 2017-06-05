SELECT
    NOT claimed as is_valid
FROM pending_community_members_t
WHERE email = $1 AND claimed = FALSE;
