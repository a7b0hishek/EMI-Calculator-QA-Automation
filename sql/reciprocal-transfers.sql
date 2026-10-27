-- PostgreSQL dialect.
-- Directional amount rule: compare the return amount to the earlier outgoing
-- amount. The absolute difference must be <= 10% of that outgoing amount.
-- Event order is timestamp, then transaction_id for equal timestamps.

SELECT
    outgoing.transaction_id AS outgoing_transaction_id,
    return_tx.transaction_id AS return_transaction_id,
    outgoing.sender_account AS account_a,
    outgoing.receiver_account AS account_b,
    outgoing.amount AS outgoing_amount,
    return_tx.amount AS return_amount,
    ABS(return_tx.amount - outgoing.amount) AS amount_difference,
    100.0 * ABS(return_tx.amount - outgoing.amount) / outgoing.amount
        AS difference_percent_of_outgoing,
    outgoing.transaction_timestamp AS outgoing_timestamp,
    return_tx.transaction_timestamp AS return_timestamp,
    return_tx.transaction_timestamp - outgoing.transaction_timestamp AS elapsed_time
FROM section_a.reciprocal_transfers AS outgoing
JOIN section_a.reciprocal_transfers AS return_tx
  ON outgoing.sender_account = return_tx.receiver_account
 AND outgoing.receiver_account = return_tx.sender_account
 -- Keep one canonical orientation for each transaction pair. Timestamp is
 -- normally decisive; transaction_id provides a deterministic tie-breaker.
 AND (
        outgoing.transaction_timestamp < return_tx.transaction_timestamp
        OR (
            outgoing.transaction_timestamp = return_tx.transaction_timestamp
            AND outgoing.transaction_id < return_tx.transaction_id
        )
     )
 -- Inclusive 24-hour boundary.
 AND return_tx.transaction_timestamp <= outgoing.transaction_timestamp + INTERVAL '24 hours'
 -- Directional comparison against the original outgoing amount.
 AND ABS(return_tx.amount - outgoing.amount) <= outgoing.amount * 0.10
ORDER BY outgoing.transaction_id, return_tx.transaction_id;
