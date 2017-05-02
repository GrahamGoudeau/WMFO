INSERT INTO community_members_t VALUES (
    DEFAULT,
    $1,
    $2,
    $3,
    $4,
    DEFAULT,
    DEFAULT,
    $5,
    DEFAULT
) RETURNING id;
