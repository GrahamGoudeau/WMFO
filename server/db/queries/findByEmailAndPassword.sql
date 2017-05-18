SELECT
    id,
    first_name,
    last_name,
    email,
    active,
    tufts_id,
    last_agreement_signed,
    permission_level
FROM community_members_t
LEFT JOIN permission_level_t ON community_members_t.id=permission_level_t.community_member_id
WHERE email = $1 AND password_hash = $2 AND active=TRUE;
