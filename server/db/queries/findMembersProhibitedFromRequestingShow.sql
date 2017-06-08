/* Get a list of ids that are NOT allowed to submit show request */
SELECT
    id
FROM community_members_t
WHERE
    ((id IN ($1:csv)) AND
        (last_agreement_signed IS NULL OR last_agreement_signed <> (SELECT max(id) FROM agreements_t)))
    OR active = FALSE;
