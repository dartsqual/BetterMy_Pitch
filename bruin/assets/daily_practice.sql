/* @bruin
name: analytics.daily_practice
type: pg.sql
description: Practice volume and readiness trend per day.
materialization:
  type: table
depends:
  - analytics.session_summary
columns:
  - name: practice_date
    type: date
    checks:
      - name: not_null
      - name: unique
@bruin */

select
    practice_date,
    count(*) as sessions,
    count(*) filter (where status = 'scored') as scored_sessions,
    round(avg(readiness_score), 1) as avg_readiness,
    max(readiness_score) as best_readiness,
    round(avg(total_turns), 1) as avg_turns,
    round(avg(duration_minutes), 1) as avg_duration_minutes,
    sum(coach_hints) as coach_hints
from analytics.session_summary
group by practice_date
order by practice_date
