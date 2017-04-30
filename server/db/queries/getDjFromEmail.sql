SELECT
    id,
    first_name,
    last_name,
    email,
    tufts_id,
    last_agreement_signed,
    permission_level
FROM community_members_t
LEFT JOIN permission_level_t ON permission_level_t.community_member_id = community_members_t.id
WHERE active = TRUE AND email = 'grahamgoudeau@gmail.com';
