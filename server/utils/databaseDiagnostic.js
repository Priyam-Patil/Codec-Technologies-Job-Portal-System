// Return only controlled diagnostics. Driver messages may contain confidential hosts/URIs.
export function databaseDiagnostic(error) {
  const codes = new Set();
  const visit = (value, depth = 0) => {
    if (!value || depth > 5) return;
    if (value.code !== undefined) codes.add(String(value.code));
    for (const code of ['ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED', 'ETIMEDOUT', 'AuthenticationFailed']) {
      if (String(value.message || '').includes(code)) codes.add(code);
    }
    for (const nested of [value.cause, value.reason, value.error]) visit(nested, depth + 1);
    if (value.servers instanceof Map) for (const server of value.servers.values()) visit(server, depth + 1);
  };
  visit(error);
  if (codes.has('ENOTFOUND') || codes.has('EAI_AGAIN')) return { code: 'DATABASE_DNS_UNAVAILABLE', message: 'Database DNS resolution failed. Review the configured database and network DNS without changing credentials automatically.' };
  if (codes.has('18') || codes.has('AuthenticationFailed')) return { code: 'DATABASE_AUTHENTICATION_FAILED', message: 'Database authentication failed. Review the authorized database credentials manually.' };
  if (codes.has('ECONNREFUSED')) return { code: 'DATABASE_CONNECTION_REFUSED', message: 'The database connection was refused. Check that the authorized database and network access are available.' };
  if (codes.has('ETIMEDOUT')) return { code: 'DATABASE_CONNECTION_TIMEOUT', message: 'The database connection timed out. Check network access and the authorized database service.' };
  return { code: 'DATABASE_UNAVAILABLE', message: 'The database is unavailable. Check database configuration and network access.' };
}
