SELECT
    cm.email,
    SUM(
        CASE WHEN (vh.semester <> $1 OR vh.year <> $2 OR vh.num_hours IS NULL OR NOT vh.confirmed) THEN 0
        ELSE vh.num_hours END
    ) AS num_hours
FROM volunteer_hours_t vh
RIGHT JOIN community_members_t cm ON vh.community_member_id = cm.id
WHERE cm.active = TRUE
GROUP BY cm.email;
