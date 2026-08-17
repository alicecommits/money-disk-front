const DATE_OPERATION_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Import-wizard guard: by the time a row reaches the review table its
 * date_operation should already be an ISO string. The backend coerces
 * unparseable CSV dates to null (pd.to_datetime(..., errors="coerce")
 * yields NaT, which strftime turns into None) rather than guessing — so
 * null and malformed strings both mean "the column mapping was wrong,"
 * and both must block confirm rather than being silently imported.
 */
export function isValidDateOperation(date: string | null): boolean {
  return date != null && DATE_OPERATION_PATTERN.test(date);
}
