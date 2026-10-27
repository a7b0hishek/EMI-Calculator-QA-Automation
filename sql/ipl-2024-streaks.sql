-- PostgreSQL dialect.
-- A match with no player-innings rows is a non-appearance, not a zero score.
-- The match-number gap therefore breaks any streak across that match.

WITH player_match_totals AS (
    -- Aggregate every innings row before applying the per-match threshold.
    SELECT
        match.season_year,
        match.match_number,
        match.match_date,
        player.player_id,
        player.player_name,
        SUM(innings.runs_scored)::INTEGER AS runs_in_match
    FROM section_a.ipl_matches AS match
    JOIN section_a.ipl_player_innings AS innings
      ON innings.match_id = match.match_id
    JOIN section_a.ipl_players AS player
      ON player.player_id = innings.player_id
    WHERE match.season_year = 2024
    GROUP BY
        match.season_year,
        match.match_number,
        match.match_date,
        player.player_id,
        player.player_name
), qualifying_matches AS (
    SELECT *
    FROM player_match_totals
    WHERE runs_in_match >= 30
), numbered_matches AS (
    -- For consecutive match numbers, match_number - row_number is constant.
    -- A low score or non-appearance leaves a match-number gap and starts a new group.
    SELECT
        qualifying_matches.*,
        match_number - ROW_NUMBER() OVER (
            PARTITION BY player_id, season_year
            ORDER BY match_number
        ) AS streak_group
    FROM qualifying_matches
), streaks AS (
    SELECT
        season_year,
        player_id,
        player_name,
        streak_group,
        MIN(match_number) AS streak_start_match_number,
        MAX(match_number) AS streak_end_match_number,
        MIN(match_date) AS streak_start_date,
        MAX(match_date) AS streak_end_date,
        COUNT(*)::INTEGER AS streak_length
    FROM numbered_matches
    GROUP BY season_year, player_id, player_name, streak_group
    HAVING COUNT(*) >= 3
)
SELECT
    player_id,
    player_name,
    season_year,
    streak_start_match_number,
    streak_end_match_number,
    streak_start_date,
    streak_end_date,
    streak_length
FROM streaks
ORDER BY streak_start_date, player_name;
