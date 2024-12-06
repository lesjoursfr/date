/**
 * Module Dependencies
 */
import createDebug from "debug";
import ParserDate from "./date";
import norm from "./norm";
const debug = createDebug("date:parser");

/**
 * Days
 */
const months = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

/**
 * Regexs
 */
// 5, 05, 5:30, 5.30, 05:30:10, 05:30.10, 05.30.10, at 5
const rMeridiem = /^(\d{1,2})([:.](\d{1,2}))?([:.](\d{1,2}))?\s*([ap]m)/;
const rHourMinute = /^(\d{1,2})([:.](\d{1,2}))([:.](\d{1,2}))?/;
const rAtHour = /^at\s?(\d{1,2})$/;
const rDays = /\b(sun(day)?|mon(day)?|tues(day)?|wed(nesday)?|thur(sday|s)?|fri(day)?|sat(urday)?)s?\b/;
const rMonths =
  /^((\d{1,2})\s*(st|nd|rd|th))\s(day\s)?(of\s)?(january|february|march|april|may|june|july|august|september|october|november|december)/i;
const rPast = /\b(last|yesterday|ago|today)\b/;
const rDayMod = /\b(morning|noon|afternoon|tonight|evening|midnight)\b/;
const rAgo = /^(\d*)\s?\b(second|minute|hour|day|week|month|year)[s]?\b\s?ago$/;

type TimeUnit = "second" | "minute" | "hour" | "day" | "week" | "month" | "year";

/**
 * Type Guard
 */
type ExtractMethodNames<T> = { [K in keyof T]: T[K] extends (n: number) => ParserDate ? K : never }[keyof T];
type ParserDateModifier = ExtractMethodNames<ParserDate>;

function isParserDateModifier(mod: string): mod is ParserDateModifier {
  return (
    Object.hasOwnProperty.call(ParserDate.prototype, mod) &&
    ParserDate.prototype[mod as ParserDateModifier].length === 1
  );
}

/**
 * Parser class
 */
export default class Parser {
  /**
   * Convinient method to parse a string & return a Date
   * @param {String} str
   * @return {Date}
   */
  public static parse(str: string, offset?: string | Date): Date {
    return new Parser(str, offset).parse();
  }

  private str: string;
  private offset?: Date;
  private date!: ParserDate;
  private original!: string;
  private stash!: Array<string>;
  private tokens!: Array<string | undefined>;
  private _meridiem!: "am" | "pm" | null;

  /**
   * Initialize `parser`
   *
   * @param {String} str
   * @return {Date}
   * @api publics
   */
  public constructor(str: string, offset?: string | Date) {
    this.str = str;
    this.offset = typeof offset === "string" ? Parser.parse(offset) : offset;
  }

  public parse(): Date {
    // CFG preprocessing into normalized format,
    // get {str, tokens, normals}
    // !future: return multiple parsed times, some from it
    const prepro = norm(this.str);
    // console.log(prepro)
    // reset the str to prepro str
    this.str = prepro.str;
    // if proprocessed doesn't leave any str to be processed (non-date-time) format, check normals
    if (!this.str) {
      if (prepro.normals.length) {
        // if there's normal date parsed already,
        // !return the first
        return new Date(prepro.normals[0]);
      }
    }

    const d = this.offset || new Date();
    this.date = new ParserDate(d);
    this.original = this.str;
    this.str = this.str.toLowerCase();
    this.stash = [];
    this.tokens = [];
    this._meridiem = null;
    while (this.advance() !== "eos") debug("tokens %j", this.tokens);
    this.nextTime(d);
    if (this.date.date == d) {
      throw new Error("Invalid date");
    }
    return this.date.date;
  }

  /**
   * Advance a token
   */
  private advance(): string {
    const tok: string = (this.eos() ||
      this.space() ||
      this._next() ||
      this.last() ||
      this.dayByName() ||
      this.monthByName() ||
      this.timeAgo() ||
      this.ago() ||
      this.yesterday() ||
      this.tomorrow() ||
      this.fortnight() ||
      this.am() ||
      this.pm() ||
      this.midnight() ||
      this.tonight() ||
      this.evening() ||
      this.afternoon() ||
      this.morning() ||
      this.meridiem() ||
      this.hourminute() ||
      this.athour() ||
      this.week() ||
      this.month() ||
      this.year() ||
      this.second() ||
      this.minute() ||
      this.hour() ||
      this.day() ||
      this.number() ||
      this.string() ||
      this.other()) as string;

    this.tokens.push(tok);
    return tok;
  }

  /**
   * Lookahead `n` tokens.
   *
   * @param {Number} n
   * @return {string}
   * @api private
   */
  private lookahead(n: number): string {
    let fetch = n - this.stash.length;
    if (fetch === 0) {
      return this.lookahead(++n);
    }
    while (fetch-- > 0) {
      this.stash.push(this.advance());
    }
    return this.stash[--n];
  }

  /**
   * Lookahead a single token.
   *
   * @return {string}
   * @api private
   */
  private peek(): string {
    return this.lookahead(1);
  }

  /**
   * Fetch next token including those stashed by peek.
   *
   * @return {string}
   * @api private
   */
  private next(): string {
    const tok = this.stashed() || this.advance();
    return tok;
  }

  /**
   * Return the next possibly stashed token.
   *
   * @return {string|undefined}
   * @api private
   */
  private stashed(): string | undefined {
    const stashed = this.stash.shift();
    return stashed;
  }

  /**
   * Consume the given `len`.
   *
   * @param {Number|Array} len
   * @api private
   */
  private skip(len: number | Array<string>): void {
    this.str = this.str.substring(Array.isArray(len) ? len[0].length : len);
  }

  /**
   * EOS
   */
  private eos(): "eos" | undefined {
    if (this.str.length) {
      return;
    }
    return "eos";
  }

  /**
   * Space
   */
  private space() {
    let captures;
    if ((captures = /^([ \t]+)/.exec(this.str))) {
      this.skip(captures);
      return this.advance();
    }
  }

  /**
   * Second
   */
  private second(): "second" | undefined {
    let captures;
    if ((captures = /^s(ec|econd)?s?/.exec(this.str))) {
      this.skip(captures);
      return "second";
    }
  }

  /**
   * Minute
   */
  private minute(): "minute" | undefined {
    let captures;
    if ((captures = /^m(in|inute)?s?/.exec(this.str))) {
      this.skip(captures);
      return "minute";
    }
  }

  /**
   * Hour
   */
  private hour(): "hour" | undefined {
    let captures;
    if ((captures = /^h(r|our)s?/.exec(this.str))) {
      this.skip(captures);
      return "hour";
    }
  }

  /**
   * Day
   */
  private day() {
    let captures;
    if ((captures = /^d(ay)?s?/.exec(this.str))) {
      this.skip(captures);
      return "day";
    }
  }

  /**
   * Day by name
   */
  private dayByName(): string | undefined {
    let captures;
    const r = new RegExp("^" + rDays.source);
    if ((captures = r.exec(this.str))) {
      const day = captures[1] as "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday";
      this.skip(captures);
      this.date[day](1);
      return captures[1];
    }
  }

  /**
   * Month by name
   */
  private monthByName(): string | undefined {
    let captures;
    if ((captures = rMonths.exec(this.str))) {
      const day = captures[2];
      const month = captures[6];
      this.date.date.setMonth(months.indexOf(month));
      if (day) this.date.date.setDate(parseInt(day));
      this.skip(captures);
      return captures[0];
    }
  }

  private timeAgo(): "timeAgo" | undefined {
    let captures;
    if ((captures = rAgo.exec(this.str))) {
      const num = captures[1];
      const mod = captures[2] as TimeUnit;
      this.date[mod](-num);
      this.skip(captures);
      return "timeAgo";
    }
  }

  /**
   * Week
   */
  private week(): "week" | undefined {
    let captures;
    if ((captures = /^w(k|eek)s?/.exec(this.str))) {
      this.skip(captures);
      return "week";
    }
  }

  /**
   * Month
   */
  private month(): "month" | undefined {
    let captures;
    if ((captures = /^mon(th)?(es|s)?\b/.exec(this.str))) {
      this.skip(captures);
      return "month";
    }
  }

  /**
   * Week
   */
  private year(): "year" | undefined {
    let captures;
    if ((captures = /^y(r|ear)s?/.exec(this.str))) {
      this.skip(captures);
      return "year";
    }
  }

  /**
   * Meridiem am/pm
   */
  private meridiem(): "meridiem" | undefined {
    let captures;
    if ((captures = rMeridiem.exec(this.str))) {
      this.skip(captures);
      this.time(
        parseInt(captures[1], 10),
        parseInt(captures[3], 10),
        parseInt(captures[5], 10),
        captures[6] as "am" | "pm"
      );
      return "meridiem";
    }
  }

  /**
   * Hour Minute (ex. 12:30)
   */
  private hourminute(): "hourminute" | undefined {
    let captures;
    if ((captures = rHourMinute.exec(this.str))) {
      this.skip(captures);
      this.time(parseInt(captures[1], 10), parseInt(captures[3], 10), parseInt(captures[5], 10), this._meridiem);
      return "hourminute";
    }
  }

  /**
   * At Hour (ex. at 5)
   */
  private athour(): "athour" | undefined {
    let captures;
    if ((captures = rAtHour.exec(this.str))) {
      this.skip(captures);
      this.time(parseInt(captures[1], 10), 0, 0, this._meridiem);
      this._meridiem = null;
      return "athour";
    }
  }

  /**
   * Time set helper
   */
  private time(h: number, m: number | false, s: number | false, meridiem: "am" | "pm" | null): void {
    const d = this.date;

    if (meridiem) {
      // convert to 24 hour
      h = "pm" == meridiem && 12 > h ? h + 12 : h; // 6pm => 18
      h = "am" == meridiem && 12 === h ? 0 : h; // 12am => 0
    }

    m = !m && d.changed("minutes") ? false : m;
    s = !s && d.changed("seconds") ? false : s;
    d.time(h, m, s);
  }

  /**
   * Best attempt to pick the next time this date will occur
   *
   * TODO: place at the end of the parsing
   */
  private nextTime(before: Date): Parser {
    const d = this.date;
    const orig = this.original;

    if (before.getTime() <= d.date.getTime() || rPast.test(orig)) {
      return this;
    }

    // If time is in the past, we need to guess at the next time
    if (rDays.test(orig)) {
      d.day(7);
    } else if ((before.getTime() - d.date.getTime()) / 1000 > 60) {
      // If it is a month in the past, don't add a day
      if (rMonths.test(orig)) {
        d.day(0);
      } else {
        d.day(1);
      }
    }

    return this;
  }

  /**
   * Yesterday
   */
  private yesterday(): "yesterday" | undefined {
    let captures;
    if ((captures = /^(yes(terday)?)/.exec(this.str))) {
      this.skip(captures);
      this.date.day(-1);
      return "yesterday";
    }
  }

  /**
   * Tomorrow
   */
  private tomorrow(): "tomorrow" | undefined {
    let captures;
    if ((captures = /^tom(orrow)?/.exec(this.str))) {
      this.skip(captures);
      this.date.day(1);
      return "tomorrow";
    }
  }

  /**
   * Fortnight
   */
  private fortnight(): "fortnight" | undefined {
    let captures;
    if ((captures = /^fortnight/.exec(this.str))) {
      this.skip(captures);
      this.date.day(14);
      return "fortnight";
    }
  }

  /**
   * Morning / AM (arbitrarily set at 7am)
   */
  private am(): "am" | undefined {
    let captures;
    if ((captures = /^am\b/.exec(this.str))) {
      this.skip(captures);
      if (!this.date.changed("hours")) {
        this.date.date.setHours(7, 0, 0);
      }
      return "am";
    }
  }

  /**
   * Noon / PM (arbitrarily set at 12am)
   */
  private pm(): "pm" | undefined {
    let captures;
    if ((captures = /^pm\b/.exec(this.str))) {
      this.skip(captures);
      if (!this.date.changed("hours")) {
        this.date.date.setHours(12, 0, 0);
      }
      return "pm";
    }
  }

  /**
   * Midnight
   */
  private midnight(): "midnight" | undefined {
    let captures;
    if ((captures = /^midnight\b/.exec(this.str))) {
      this.skip(captures);
      this.date.date.setHours(0, 0, 0);
      return "midnight";
    }
  }

  /**
   * Tonight (arbitrarily set at 7pm)
   */
  private tonight(): "tonight" | undefined {
    let captures;
    if ((captures = /^tonight\b/.exec(this.str))) {
      this.skip(captures);
      this._meridiem = "pm";
      if (!this.date.changed("hours")) {
        this.date.date.setHours(19, 0, 0);
      }

      return "tonight";
    }
  }

  /**
   * Evening (arbitrarily set at 5pm)
   */
  private evening(): "evening" | undefined {
    let captures;
    if ((captures = /^evening\b/.exec(this.str))) {
      this.skip(captures);
      this._meridiem = "pm";
      if (!this.date.changed("hours")) {
        this.date.date.setHours(17, 0, 0);
      }
      return "evening";
    }
  }

  /**
   * Afternoon (arbitrarily set at 2pm)
   */
  private afternoon(): "afternoon" | undefined {
    let captures;
    if ((captures = /^afternoon\b/.exec(this.str))) {
      this.skip(captures);
      this._meridiem = "pm";
      if (!this.date.changed("hours")) {
        this.date.date.setHours(14, 0, 0);
      }
      return "afternoon";
    }
  }

  /**
   * Morning (arbitrarily set at 8am)
   */
  private morning(): "morning" | undefined {
    let captures;
    if ((captures = /^morning\b/.exec(this.str))) {
      this.skip(captures);
      this._meridiem = "am";
      if (!this.date.changed("hours")) {
        this.date.date.setHours(8, 0, 0);
      }
      return "morning";
    }
  }

  /**
   * Next time
   */
  private _next(): "next" | undefined {
    let captures;
    if ((captures = /^next/.exec(this.str))) {
      this.skip(captures);
      const d = new Date(this.date.date);
      const mod = this.peek();

      // If we have a defined modifier, then update
      if (isParserDateModifier(mod)) {
        this.next();
        // slight hack to modify already modified
        this.date = new ParserDate(d);
        this.date[mod](1);
      } else if (rDayMod.test(mod)) {
        this.date.day(1);
      }

      return "next";
    }
  }

  /**
   * Last time
   */
  private last(): "last" | undefined {
    let captures;
    if ((captures = /^last/.exec(this.str))) {
      this.skip(captures);
      const d = new Date(this.date.date);
      const mod = this.peek();

      // If we have a defined modifier, then update
      if (isParserDateModifier(mod)) {
        this.next();
        // slight hack to modify already modified
        this.date = new ParserDate(d);
        this.date[mod](-1);
      } else if (rDayMod.test(mod)) {
        this.date.day(-1);
      }

      return "last";
    }
  }

  /**
   * Ago
   */
  private ago(): "ago" | undefined {
    let captures;
    if ((captures = /^ago\b/.exec(this.str))) {
      this.skip(captures);
      return "ago";
    }
  }

  /**
   * Number
   */
  private number(): "number" | undefined {
    let captures;
    if ((captures = /^(\d+)/.exec(this.str))) {
      let n = parseInt(captures[1], 10);
      this.skip(captures);
      const mod = this.peek();

      // If we have a defined modifier, then update
      if (isParserDateModifier(mod)) {
        if ("ago" === this.peek()) {
          n = -n;
        }
        this.date[mod](n);
      } else if (this._meridiem) {
        // when we don't have meridiem, possibly use context to guess
        this.time(n, 0, 0, this._meridiem);
        this._meridiem = null;
      } else if (this.original.indexOf("at") > -1) {
        this.time(n, 0, 0, this._meridiem);
        this._meridiem = null;
      }

      return "number";
    }
  }

  /**
   * String
   */
  private string(): "string" | undefined {
    let captures;
    if ((captures = /^\w+/.exec(this.str))) {
      this.skip(captures);
      return "string";
    }
  }

  /**
   * Other
   */
  private other(): "other" | undefined {
    let captures;
    if ((captures = /^./.exec(this.str))) {
      this.skip(captures);
      return "other";
    }
  }
}
