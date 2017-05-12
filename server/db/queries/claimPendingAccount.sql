UPDATE
    pending_community_members_t
SET claimed = TRUE
WHERE email = $1;
