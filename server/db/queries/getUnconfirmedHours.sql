SELECT
    vh.id,
    vh.created,
    vh.volunteer_date,
    vh.num_hours,
    vh.description,
    vh.confirmed,
    cm.email
FROM volunteer_hours_t vh
JOIN community_members_t cm ON vh.community_member_id = cm.id;
