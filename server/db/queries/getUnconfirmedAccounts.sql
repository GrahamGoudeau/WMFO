SELECT
    id,
    first_name,
    last_name,
    email,
    tufts_id,
    last_agreement_signed
FROM community_members_t
WHERE account_confirmed = FALSE;
