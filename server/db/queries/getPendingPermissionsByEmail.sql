SELECT
    pending_community_members_email,
    permission_level
FROM pending_members_permissions_t
WHERE pending_community_members_email = $1;
