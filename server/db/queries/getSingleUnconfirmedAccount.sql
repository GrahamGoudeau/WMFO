SELECT
    email,
    code,
    permission_levels
FROM pending_members_with_permissions_v
WHERE code = $1;
