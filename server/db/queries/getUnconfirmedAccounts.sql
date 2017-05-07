SELECT
    pcm.email,
    pcm.code,
    ARRAY_TO_JSON(ARRAY_AGG(pmp.permission_level)) AS permission_levels
FROM pending_community_members_t pcm
LEFT JOIN pending_members_permissions_t pmp ON pmp.pending_community_members_email = pcm.email
GROUP BY pcm.email;
