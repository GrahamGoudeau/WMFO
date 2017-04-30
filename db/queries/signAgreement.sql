UPDATE community_members_t
SET last_agreement_signed = $1
WHERE id = $2;
