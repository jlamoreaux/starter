/**
 * Parse a named flag value supporting both --flag value and --flag=value forms.
 *
 * Returns the value string if the flag is found with a value.
 * Returns undefined if the flag is not present at all.
 * Throws if the flag is present but has no value (missing or next token is another flag).
 */
export function getFlagValue(args: string[], ...flags: string[]): string | undefined {
  for (const flag of flags) {
    // --flag=value form
    const eqIndex = args.findIndex((a) => a.startsWith(`${flag}=`));
    if (eqIndex !== -1) {
      return args[eqIndex].slice(flag.length + 1);
    }

    // --flag value form
    const spaceIndex = args.indexOf(flag);
    if (spaceIndex !== -1) {
      const next = args[spaceIndex + 1];
      if (next === undefined || next.startsWith("-")) {
        throw new Error(`Flag ${flag} requires a value`);
      }
      return next;
    }
  }

  return undefined;
}
