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

- `ipl_matches` records every match in the season's match-number sequence and its date. For a real analysis, load the complete official season schedule into this table, even for matches a player did not appear in.
- `ipl_players` maps player IDs to names.
- `ipl_player_innings` records an appearance's innings score. The query first sums all rows for a player and match, then applies the 30-run threshold.
- No innings row for a player in a match means that player did not appear. A missing appearance and a recorded match total below 30 both break a streak; the query does not invent a zero-score row.

The query keeps only player-match totals of at least 30, then groups rows where the match numbers are consecutive using `match_number - ROW_NUMBER()`. Three qualifying scores separated by a low score or a non-appearance therefore cannot form one streak. It returns maximal streaks of length three or more, with player, season, start/end match numbers, start/end dates, and length.

The sample contains three fictional players and seven consecutive illustrative match rows. Asha Sample has 30, 44, and 31 runs in matches 1–3; the 31 in match 3 is represented by two innings rows (16 + 15) solely to exercise aggregation. That two-innings-in-one-match fixture is intentionally synthetic and is not presented as a typical IPL scorecard. Kabir Sample scores at least 30 in four straight matches (4–7). Dev Sample has low-scoring and absent matches between qualifying scores and has no qualifying streak.

### Expected output

| Player | Start match | End match | Start date | End date | Streak length |
|---|---:|---:|---|---|---:|
| Asha Sample | 1 | 3 | 2024-03-22 | 2024-03-24 | 3 |
| Kabir Sample | 4 | 7 | 2024-03-25 | 2024-03-28 | 4 |

Dev Sample should not appear in the result.

## Verification status and evidence

The project environment has no native `psql` or PostgreSQL server binaries, and Docker/Podman are unavailable. The exact `schema.sql` and both query files were nevertheless executed in a temporary **PGlite 0.5.12** PostgreSQL-compatible WASM database. The schema loaded successfully; the transfer query returned five rows and the streak query returned two rows exactly as listed above. This validates execution in PGlite, but is not a claim that a native PostgreSQL server was used.

The screenshots below were captured from those live query result rows in headless Chrome. The originals remain under the Git-ignored `reports/sql/` directory; copies for submission are in `docs/evidence/sql/`:

- [Reciprocal transfer query output](../docs/evidence/sql/reciprocal-transfers.png)
- [IPL scoring streak query output](../docs/evidence/sql/ipl-2024-streaks.png)

For a native PostgreSQL check, run the setup and `psql` commands above against a dedicated PostgreSQL database.
