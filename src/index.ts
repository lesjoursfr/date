/**
 * Expose `Date`
 */
import Parser from "./parser.js";

export default function (str: string, offset?: string | Date): Date {
  return Parser.parse(str, offset);
}
