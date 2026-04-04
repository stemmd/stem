// Returns a SQL fragment (aliased as 's') that enforces stem visibility rules,
// plus the three positional bindings it needs (all viewerId).
// Usage:
//   const { sql, bindings } = stemVisibilityFilter(user?.id ?? null);
//   db.prepare(`SELECT ... FROM stems s WHERE s.user_id = ? AND ${sql}`)
//     .bind(ownerId, ...bindings)
export function stemVisibilityFilter(viewerId: string | null): {
  sql: string;
  bindings: [string, string, string];
} {
  const id = viewerId ?? "";
  return {
    sql: `(
      s.visibility = 'public'
      OR s.user_id = ?
      OR (s.visibility = 'mutuals' AND (
        SELECT COUNT(*) FROM user_follows
        WHERE (follower_id = ? AND following_id = s.user_id)
           OR (follower_id = s.user_id AND following_id = ?)
      ) = 2)
    )`,
    bindings: [id, id, id],
  };
}

// Checks whether a single stem's visibility allows viewing by viewerId.
// Used on the stem detail page where we fetch first, then gate.
// Returns the mutual-check SQL + bindings (2 positional params: viewerId, viewerId).
export function mutualCheckSql(): string {
  return `SELECT COUNT(*) as c FROM user_follows
    WHERE (follower_id = ? AND following_id = ?)
       OR (follower_id = ? AND following_id = ?)`;
}
