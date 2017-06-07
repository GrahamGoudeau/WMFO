UPDATE community_members_t SET
active = NOT active
WHERE id = $1
RETURNING active;
