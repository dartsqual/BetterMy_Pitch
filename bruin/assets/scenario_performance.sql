/* @bruin
name: analytics.scenario_performance
type: pg.sql
description: Average scores by buyer persona, difficulty, framework and language — where sellers struggle most.
materialization:
  type: table
depends:
  - analytics.session_summary
@bruin */

select
    persona_name,
    difficulty,
    framework,
    language,
    count(*) as sessions,
    count(readiness_score) as scored_sessions,
    round(avg(readiness_score), 1) as avg_readiness,
    round(avg(discovery_depth), 1) as avg_discovery_depth,
    round(avg(objection_handling), 1) as avg_objection_handling,
    round(avg(value_articulation), 1) as avg_value_articulation,
    round(avg(conciseness_pacing), 1) as avg_conciseness_pacing,
    round(avg(total_turns), 1) as avg_turns
from analytics.session_summary
group by persona_name, difficulty, framework, language
