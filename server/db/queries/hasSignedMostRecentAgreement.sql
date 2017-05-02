SELECT
    (CASE WHEN (last_agreement_signed =
            (SELECT MAX(id) FROM agreements_t)) THEN TRUE ELSE FALSE
    END) as result
FROM community_members_t WHERE id=$1;
