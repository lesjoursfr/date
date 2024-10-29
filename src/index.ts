/**
 * Expose `Date`
 */
import Parser from "./parser";

export default function (str: string, offset?: string | Date): Date {
  return Parser.parse(str, offset);
}
