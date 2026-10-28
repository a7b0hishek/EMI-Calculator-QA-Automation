# Section A SQL exercises

**Dialect: PostgreSQL.** The DDL and queries use PostgreSQL features such as `TIMESTAMPTZ`, `INTERVAL`, identity columns, `EXCLUDED`, and PostgreSQL casts. They are intended to run in PostgreSQL, not SQLite.

The objects are namespaced under `section_a`. `schema.sql` creates the tables and inserts small synthetic fixtures using upserts, so rerunning it resets the named sample rows. Use a fresh or dedicated database for the expected outputs below; additional rows in these tables can change the result sets.

## Setup and execution

From the project root, create a dedicated database and load the schema/sample data:

```sh
createdb streamhub_section_a
psql -X -v ON_ERROR_STOP=1 -d streamhub_section_a -f sql/schema.sql
```

Run each query:

```sh
psql -X -v ON_ERROR_STOP=1 -P pager=off -d streamhub_section_a -f sql/reciprocal-transfers.sql
psql -X -v ON_ERROR_STOP=1 -P pager=off -d streamhub_section_a -f sql/ipl-2024-streaks.sql
```

`schema.sql` defines `section_a.reciprocal_transfers`, `section_a.ipl_players`, `section_a.ipl_matches`, and `section_a.ipl_player_innings`. The IPL names, teams, match assignments, and scores are illustrative sample data, not a complete or official IPL 2024 dataset.

## Exercise 1: reciprocal transfers

### Schema and matching rule

Each transfer has a unique transaction ID, sender, receiver, positive amount in INR-like decimal units, and a timezone-aware timestamp. Self-transfers and blank account identifiers are rejected by the schema.

For the earlier transfer A → B with amount `x`, the return B → A with amount `y` qualifies when:

```text
0 <= return timestamp - outgoing timestamp <= 24 hours
ABS(y - x) <= 0.10 * x
```

The 24-hour bound is inclusive. The amount rule is **directional**, using the earlier outgoing amount as the reference; it is not a symmetric percent-difference measure. Thus 100 → 110 and 100 → 90 are both exactly at the 10% boundary and qualify, while 90 → 100 differs by 11.11% of the outgoing 90 and does not.

The self-join requires opposite directions. A pair is ordered by `(transaction_timestamp, transaction_id)`: the earlier event is treated as outgoing, and the ID breaks ties when timestamps are equal. This makes each transaction-ID pair appear at most once. Separate rows with identical-looking values but distinct transaction IDs remain distinct transactions and can form distinct pairs.

### Sample result

`reciprocal-transfers.sql` should return these five transaction pairs against the supplied fixture data:

| Outgoing ID | Return ID | Accounts | Amounts | Difference from outgoing | Reason |
|---:|---:|---|---:|---:|---|
| 1001 | 1002 | A → B → A | 100.00 → 110.00 | 10.00% | Exactly 24 hours and exactly +10% |
| 2001 | 2002 | C → D → C | 50.00 → 50.00 | 0.00% | Equal amounts and equal timestamps; ID tie-break |
| 3001 | 3002 | E → F → E | 100.00 → 90.00 | 10.00% | Exactly −10% |
| 6001 | 6003 | K → L → K | 25.00 → 25.00 | 0.00% | First distinct duplicate-looking transaction pair |
| 6002 | 6003 | K → L → K | 25.00 → 25.00 | 0.00% | Second distinct transaction-ID pair |

The 110.01 return, the return 24 hours and one second later, and the 90 → 100 directional comparison are excluded. The two K → L transfers are not collapsed because they have distinct transaction IDs; each valid ID pair is reported once.

## Exercise 2: IPL 2024 scoring streaks

### Schema and streak rule

- `ipl_matches` records each included match and its season match number/date.
- `ipl_players` maps player IDs to names.
- `ipl_player_innings` records a batting appearance's innings score. The query first sums all rows for a player and match, then applies the 30-run threshold.
- No innings row for a player in a match means that player did not have a batting appearance in that match; the query does not invent a zero-score row.

The query first numbers every player batting appearance by season match number, then filters totals below 30. A low-scoring appearance leaves a gap in that player's sequence and breaks a streak. A season match with no batting appearance for that player does not add a sequence row, so consecutive means consecutive player appearances rather than consecutive global IPL match numbers or calendar dates. It returns maximal streaks of length three or more, with player, season, first/last match numbers and dates, and streak length.

If a player has multiple qualifying streaks, each maximal run is a separate result. A four-appearance run is one four-match result rather than overlapping three-match windows.

The sample contains three fictional players and seven illustrative match rows. Asha Sample scores 30, 44, and 31 in matches 1, 3, and 5; those are three consecutive player appearances despite intervening season match numbers. The 31 in match 5 is represented by two innings rows (16 + 15) to exercise aggregation. This split is intentionally synthetic and is not presented as a typical IPL scorecard. Kabir Sample scores at least 30 in four consecutive personal appearances (matches 4–7). Dev Sample has low-scoring appearances that break his run and has no qualifying streak.

### Expected output

| Player | Start match | End match | Start date | End date | Streak length |
|---|---:|---:|---|---|---:|
| Asha Sample | 1 | 5 | 2024-03-22 | 2024-03-26 | 3 |
| Kabir Sample | 4 | 7 | 2024-03-25 | 2024-03-28 | 4 |

Dev Sample should not appear in the result.

### Review of the real 2024 data source

The established source checked for a real-season import was the [Cricsheet IPL JSON archive](https://cricsheet.org/downloads/ipl_json.zip). Cricsheet identifies JSON as its primary match-data format and licenses its JSON data under the [Open Data Commons Attribution License 1.0](https://opendatacommons.org/licenses/by/1.0/). Relevant nested fields include `info.event.name`, `info.dates`, `info.event.match_number`, `info.teams`, `info.players`, and each innings' `overs[].deliveries[]` fields such as `batter` and `runs.batter`.

Preprocessing for the coverage audit selects JSON records whose event name is `Indian Premier League` and whose first `info.dates` value is in 2024. On the archive retrieved 2026-10-28 (SHA-256 recorded in the evidence file), this selected **71 match files**. Only 67 of the 70 numbered league matches were present; match numbers **63, 66, and 70** were absent. The archive also contained four 2024 playoff records without a numeric `event.match_number`. The [BCCI 2024 schedule](https://documents.bcci.tv/bcci/documents/1711346895837_TATA%20IPL%202024%20Schedule%20F.pdf) lists 74 matches, so the available Cricsheet archive is incomplete for a full-season analysis.

Because missing matches can change a consecutive-appearance result, these records were **not** mixed into the fixtures or presented as full-season statistics. The existing fictional sample is retained and explicitly labeled illustrative. No real-player streak result is claimed. Recheck current source coverage with:

```sh
python3 sql/audit-cricsheet-ipl-2024.py
```

The audit requires Python 3 and `curl` (used with normal certificate verification for the archive download). To audit a previously downloaded archive instead, pass `--archive /path/to/ipl_json.zip`. To reproduce the SQL output in this project, load the fixture schema and run `sql/ipl-2024-streaks.sql` using the commands above. The actual PGlite output and coverage audit are preserved under `docs/evidence/sql/`.

## Verification status and evidence

The project environment has no native `psql` or PostgreSQL server binaries, and Docker/Podman are unavailable. The exact `schema.sql` and both query files were nevertheless executed in a temporary **PGlite 0.5.12** PostgreSQL-compatible WASM database. The schema loaded successfully; the transfer query returned five rows and the streak query returned two rows exactly as listed above. A separate in-memory test-only player with two three-appearance runs returned two distinct maximal streak rows (matches 1–3 and 5–7), confirming low-score break and multiple-streak behavior without changing the saved fixture. This validates execution in PGlite, but is not a claim that a native PostgreSQL server was used.

The 2026-10-28 streak screenshot was captured from the actual PGlite query rows in headless Chrome. The earlier SQL screenshots remain preserved; the older streak screenshot predates the player-appearance adjacency definition.

- [Reciprocal transfer query output](../docs/evidence/sql/reciprocal-transfers.png)
- [Latest IPL sample streak query output](../docs/evidence/sql/ipl-2024-streaks-sample-2026-10-28.png)
- [Earlier IPL streak screenshot](../docs/evidence/sql/ipl-2024-streaks.png)

For a native PostgreSQL check, run the setup and `psql` commands above against a dedicated PostgreSQL database.
