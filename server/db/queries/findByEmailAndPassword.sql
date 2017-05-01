SELECT
    id,
    first_name,
    last_name,
    email,
    active,
    tufts_id,
    last_agreement_signed
FROM community_members_t
WHERE email = $1 AND password_hash = $2;
