/* @bruin
name: analytics.session_summary
type: pg.sql
description: One row per practice session with scores, turn counts and coach usage.
materialization:
  type: table
columns:
  - name: session_id
    type: text
    checks:
      - name: not_null
      - name: unique
custom_checks:
  - name: readiness score within 0-100
    query: select count(*) from analytics.session_summary where readiness_score not between 0 and 100
    value: 0
@bruin */

with turns as (
    select
        session_id,
        count(*) as total_turns,
        count(*) filter (where role = 'seller') as seller_turns,
        count(*) filter (where role = 'buyer') as buyer_turns,
        count(*) filter (where coach_hint is not null) as coach_hints,
        avg(length(content)) filter (where role = 'seller') as avg_seller_chars,
        max(created_at) as last_message_at
    from app.messages
    group by session_id
)
select
    s.id as session_id,
    s.created_at,
    date_trunc('day', s.created_at)::date as practice_date,
    s.status,
    s.persona_id,
    s.persona_name,
    s.difficulty,
    s.framework,
    s.language,
    coalesce(jsonb_array_length(s.members), 0) as committee_size,
    coalesce(t.total_turns, 0) as total_turns,
    coalesce(t.seller_turns, 0) as seller_turns,
    coalesce(t.buyer_turns, 0) as buyer_turns,
    coalesce(t.coach_hints, 0) as coach_hints,
    round(t.avg_seller_chars) as avg_seller_chars,
    round(extract(epoch from (coalesce(s.ended_at, t.last_message_at) - s.created_at)) / 60.0, 1) as duration_minutes,
    sc.overall as readiness_score,
    (sc.report -> 'categories' -> 'discoveryDepth' ->> 'score')::int as discovery_depth,
    (sc.report -> 'categories' -> 'objectionHandling' ->> 'score')::int as objection_handling,
    (sc.report -> 'categories' -> 'valueArticulation' ->> 'score')::int as value_articulation,
    (sc.report -> 'categories' -> 'concisenessPacing' ->> 'score')::int as conciseness_pacing,
    sc.report ->> 'verdict' as verdict,
    sc.model as evaluator_model
from app.sessions s
left join turns t on t.session_id = s.id
left join app.scorecards sc on sc.session_id = s.id
