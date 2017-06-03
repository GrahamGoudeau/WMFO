UPDATE
    community_members_t
SET password_hash = $1
WHERE id = $2;
