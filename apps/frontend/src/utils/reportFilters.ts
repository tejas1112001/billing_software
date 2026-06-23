/** Returns undefined when a select filter is empty or set to "all". */
export function reportFilterValue(value: string): string | undefined {
  return value && value !== 'all' ? value : undefined;
}
