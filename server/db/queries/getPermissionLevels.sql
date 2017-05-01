SELECT
    permission_level
FROM permission_level_t
WHERE community_member_id = $1;
