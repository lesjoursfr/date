// Module to enumerate all CFG symbols for the human language for time

/**
 * Module Dependencies
 */
import * as util from "./util";

// ///////////////////
// the CFG symbols //
// ///////////////////
abstract class AbstractParserSymbol {
  public value?: string | number;
  public canon?: string;
  public token!: string | number | { start: ParserSymbol; end: ParserSymbol };

  public constructor() {}
}

/**
 * The op for arithmetic operator.
 * note that since scaling(*,/) is very rare, we omit its implementation for now.
 */
export class op extends AbstractParserSymbol {
  public value: string;

  public constructor(value: string) {
    super();
    this.value = value;
  }
}

/**
 * The origin operator.
 */
export class o extends AbstractParserSymbol {
  public value: string;

  public constructor(value: string) {
    super();
    this.value = value;
  }
}

/**
 * The range operator.
 */
export class r extends AbstractParserSymbol {
  public value: string;

  public constructor(value: string) {
    super();
    this.value = value;
  }
}

/**
 * The cron operator.
 */
export class c extends AbstractParserSymbol {
  public value: string;

  public constructor(value: string) {
    super();
    this.value = value;
  }
}

/**
 * The n number. Calls parseFloat.
 */
export class n extends AbstractParserSymbol {
  public value: number;

  public constructor(value: string | number) {
    super();
    this.value = typeof value === "number" ? value : parseFloat(value);
  }
}

export type ParserSymbolUnits = "ms" | "s" | "m" | "h" | "d" | "w" | "M" | "y";

/**
 * The t for time t, i.e. a point in the timeline
 * units: ms, s, m, h, d, w, M, y
 * All values are string, to represent the "=" default in the units. so when performing numerical operation, use parseFloat.
 * @example
 * new t(undefined)
 * new t("")
 * // => t {}
 * new t("7h30m")
 * // => t { h: '7', m: '30' }
 * new t("7h=30m")
 * // => t { h: '7', m: '=30' }
 */
export class t extends AbstractParserSymbol {
  public ms?: string;
  public s?: string;
  public m?: string;
  public h?: string;
  public d?: string;
  public w?: string;
  public M?: string;
  public y?: string;

  public constructor(value: string) {
    super();
    // guard against falsy input
    if (!value) {
      throw new Error(`falsy value: ${value}`);
    }
    // 1. see if unit is prepended with "=" for default, or set to ''
    // 2. then consume chunks of <number><timeUnit> like "30m"
    while (value) {
      const isDefault = (value.match(/^=/) || [])[0] || "";
      value = value.replace(/^=/, "");
      // default number is "1"
      const number = (value.match(/^-?\d+(\.\d+)?/) || [])[0] || "1";
      value = value.replace(/^-?\d+(\.\d+)?/, "");
      const unit = (value.match(/^[a-zA-Z]+/) || [])[0] as ParserSymbolUnits;
      value = value.replace(/^[a-zA-Z]+/, "");
      // prepend the number (string) with isDefault, i.e. "=" or ""
      this[unit] = isDefault + number;
    }
  }

  public hasValues(): boolean {
    return (
      this.ms !== undefined ||
      this.s !== undefined ||
      this.m !== undefined ||
      this.h !== undefined ||
      this.d !== undefined ||
      this.w !== undefined ||
      this.M !== undefined ||
      this.y !== undefined
    );
  }
}

/**
 * The dt for time t, i.e. a displacement in the timeline
 * units: ms, s, m, h, d, w, M, y
 * All values are string, to represent the "=" default in the units. so when performing numerical operation, use parseFloat.
 * Same keys as <t> to allow for component-wise operation, e.g. t + dt = { ms+(d)ms, s+(d)s, ... }
 */
export class dt extends AbstractParserSymbol {
  public ms?: string;
  public s?: string;
  public m?: string;
  public h?: string;
  public d?: string;
  public w?: string;
  public M?: string;
  public y?: string;

  public constructor(value: string) {
    super();
    // guard against falsy input
    if (!value) {
      throw new Error(`falsy value: ${value}`);
    }
    // 1. see if unit is prepended with "=" for default, or set to ''
    // 2. then consume chunks of <number><timeUnit> like "30m"
    while (value) {
      const isDefault = (value.match(/^=/) || [])[0] || "";
      value = value.replace(/^=/, "");
      // default number is "1"
      const number = (value.match(/^-?\d+(\.\d+)?/) || [])[0] || "1";
      value = value.replace(/^-?\d+(\.\d+)?/, "");
      const unit = (value.match(/^[a-zA-Z]+/) || [])[0] as ParserSymbolUnits;
      value = value.replace(/^[a-zA-Z]+/, "");
      // prepend the number (string) with isDefault, i.e. "=" or ""
      this[unit] = isDefault + number;
    }
  }

  public hasValues(): boolean {
    return (
      this.ms !== undefined ||
      this.s !== undefined ||
      this.m !== undefined ||
      this.h !== undefined ||
      this.d !== undefined ||
      this.w !== undefined ||
      this.M !== undefined ||
      this.y !== undefined
    );
  }
}

/**
 * The T, implementation-specific, is a linear combination of <t> and <dt>.
 * Used to capture the human Ts, e.g. noon, afternoon, dawn, evening, today, tonight, Sunday, fortnight, weekdays, weekends, christmas, spring, summer, holidays etc.
 * To specify T in maps.json, follow the syntax:
 * `:` means "set", `=` means "default", use t:<value>,dt:<value> for the symbol-value, e.g. "t:=7h,dt:0h"
 * evening ~ t:=7h,dt:12h, read as "t set to default 7h, dt set to 12h"
 * later ~ t:,dt:=3h, read as "t set to nothing, dt set to default 3h"
 * beware, "" and "0" are diferent, the former is empty, the later a numerical value.
 * @param  {string} value from the Symbol.
 * @param  {string|undefined} name from the Symbol.
 * @example
 * var T = new symbol("t:=7h,dt:0h")
 * // => T { t: t { h: '=7' }, dt: dt { h: '0' } }
 * T.t
 * // => t { h: '=7' }
 * T.dt
 * // => t { h: '0' }
 */
export class T extends AbstractParserSymbol {
  public t: t | null;
  public dt: dt | null;

  public constructor(value: string, name?: string) {
    super();
    if (name == "t") {
      this.t = new t(value);
      this.dt = null;
    } else if (name == "dt") {
      this.t = null;
      this.dt = new dt(value);
    } else {
      const split = value.split(","),
        _t = split[0].split(":").pop()!,
        _dt = split[1].split(":").pop()!;
      this.t = _t ? new t(_t) : null;
      this.dt = _dt ? new dt(_dt) : null;
    }
  }
}

/**
 * The product of <r><T>, gives a time interval
 */
export class rT extends AbstractParserSymbol {
  public start: ParserSymbol;
  public end: ParserSymbol;

  public constructor(interval: { start: ParserSymbol; end: ParserSymbol }) {
    super();
    this.start = interval.start;
    this.end = interval.end;
  }
}

/**
 * The f to capture frequency for <c>.
 */
export class f extends AbstractParserSymbol {
  public value: string;

  public constructor(value: string) {
    super();
    this.value = value;
  }
}

/**
 * The product of <c><T> or <c><rT>, gives a cron time
 */
export class cT extends AbstractParserSymbol {
  public cron: string;

  public constructor(cron: string) {
    super();
    this.cron = cron;
  }
}

/**
 * Constructors for all types of symbols
 */
const symbolConstructors = {
  op: op,
  c: c,
  r: r,
  n: n,
  t: T,
  dt: T,
  T: T,
  f: f,
  o: o,
  rT: rT,
  cT: cT,
};

export type ParserSymbol = op | c | r | n | t | dt | T | f | o | rT | cT;

/**
 * The symbol constructor, given a string, lemmatize it, then return a symbol from {∅=null,op,c,r,n,t,dt,T,f}.
 * i.e. str -> parseFloat(str) -> new n(str) -> return
 * or str -> lemma(str) -> new <symbol-name>(symbol-value) -> return
 * @param {string}  str       the input string
 * @return {*} The object from the class of symbols
 * @example
 * symbol('90')
 * // => n { value: 10 }
 * symbol('hour')
 * // a <dt> time difference object
 * // => dt { h: '1' }
 * symbol('tonight')
 * // or equivalently, takes the T string too
 * symbol('t:=9h,dt:12h')
 * // a T object containing <t>, <dt>
 * // => T { t: t { h: '=9' }, dt: dt { h: '12' } }
 * symbol('unrecognized')
 * // an unrecognized string yields the null symbol ∅
 * // => null
 */
export default function symbol(
  str: string | number | null | { start: ParserSymbol; end: ParserSymbol }
): ParserSymbol | null {
  if (str === null) {
    // null gets null
    return null;
  }

  let s;
  if (typeof str === "object") {
    if (str.start && str.end) {
      // range: with 'start' and 'end'
      s = new symbolConstructors.rT(str);
    } else {
      // wrong object
      throw new Error(`Can't create symbol for ${str}!`);
    }
  } else if (typeof str === "number" || parseFloat(str).toString() === str) {
    // 'n'
    s = new symbolConstructors.n(str);
  } else if (str.match(util.reT)) {
    // if is of the T string format t:<val>,dt:<val>
    s = str.match(/\s+/g) ? null : new symbolConstructors.T(str);
  } else {
    const lem = util.lemma(str);
    s = lem.name ? new symbolConstructors[lem.name](lem.value, lem.name) : null;
    // set the canonical word from lemma
    if (s) {
      s.canon = lem.canon;
    }
    // set the original token for reference
  }

  if (s) {
    s.token = str;
  }
  return s;
}
