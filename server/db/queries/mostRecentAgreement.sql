SELECT agreement_text, date_created, id
FROM agreements_t
WHERE
    id = (SELECT MAX(id) FROM agreements_t);
