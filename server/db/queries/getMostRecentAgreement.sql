SELECT
    agreement_text,
    date_created,
    id
FROM agreements_t
WHERE date_created = (
    SELECT MAX(date_created) FROM agreements_t
);
