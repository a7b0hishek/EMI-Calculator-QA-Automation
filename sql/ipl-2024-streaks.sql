-- PostgreSQL dialect. Current rows are illustrative synthetic fixtures.
-- Consecutive means successive player batting appearances, ordered by season
-- match number; calendar-date gaps and matches without that player's score row
-- do not break the sequence. A low-scoring appearance does break a streak.
-- Output groups maximal runs, not overlapping three-match windows.

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
), player_appearances AS (
    -- Number every batting appearance before filtering so a low score leaves a
    -- gap and splits a streak, while a non-appearance adds no player sequence row.
    SELECT
        player_match_totals.*,
        ROW_NUMBER() OVER (
            PARTITION BY player_id, season_year
            ORDER BY match_number
        ) AS appearance_number
    FROM player_match_totals
), qualifying_matches AS (
    SELECT *
    FROM player_appearances
    WHERE runs_in_match >= 30
), numbered_matches AS (
    -- For consecutive qualifying appearances, appearance_number - row_number
    -- is constant. Low-scoring appearances were included in the earlier count.
    SELECT
        qualifying_matches.*,
        appearance_number - ROW_NUMBER() OVER (
            PARTITION BY player_id, season_year
            ORDER BY appearance_number
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
