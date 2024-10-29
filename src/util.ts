/**
 * Module Dependencies
 */
import maps from "./maps.json";
import * as _ from "./subdash";
import { dt, ParserSymbol, T, t } from "./symbol";

// The Time Object
type TimeObject = {
  y: number | string;
  M: number | string;
  d: number | string;
  h: number | string;
  m: number | string;
  s: number | string;
};

/**
 * The T string regex, e.g. "t:=9h,dt:12h", to encode T = <t> <dt>. Is case sensitive.
 */
export const reT = /t:\S*,dt:\S*/g;

/**
 * The ordering of time units, large to small,
 * 'mer' is the meridiem, 0 for am, 1 for pm
 * and the units used for carrying
 */
type TimeUnits = "ms" | "s" | "m" | "h" | "d" | "w" | "M" | "y";
export const timeUnitOrder: Array<TimeUnits> = ["y", "M", "w", "d", "h", "m", "s", "ms"];
export const canonTimeUnitOrder: Array<string> = [];
for (let i = 0; i < timeUnitOrder.length; i++) {
  const unit = timeUnitOrder[i];
  canonTimeUnitOrder.push(lemma(unit).canon);
}
type TimeObjectUnits = "y" | "M" | "d" | "h" | "m" | "s";
export const tOrdering: Array<TimeObjectUnits> = ["y", "M", "d", "h", "m", "s"];
const tFactor = [365, 30, 24, 60, 60];

/**
 * Delimiters for stdT string
 */
export const stdTdelim = ["-", "-", " ", ":", ":", ""];

/**
 * Convert a T string to stdT string, with default filled by nowT().
 * @example TtoStdT('t:10M05d14h48m00.000s,dt:') => 2016-10-05 14:48:00
 */
export function TtoStdT(str: string | T, offset?: string | Date): string {
  if (typeof str !== "string") {
    str = TtoStr(str);
  }
  const nowStr = nowT(offset),
    nowArr = splitT(nowStr)!,
    strArr = splitT(str)!;
  const resArr = [];
  for (let i = 0; i < nowArr.length; i++) {
    let val = parseFloat(strArr[i] as string);
    if (Number.isNaN(val)) {
      val = parseFloat(nowArr[i] as string);
    }
    resArr.push(val);
  }
  let resStr = "";
  for (let i = 0; i < stdTdelim.length; i++) {
    let num = resArr[i].toString();
    // e.g. '5.123' tends to be '05.123', fix it
    const predecimal = /(\d+)(\.\d+)?/.exec(num)![1],
      postdecimal = /(\d+)\.?(\d+)?/.exec(num)![2];
    if (predecimal.length == 1) {
      num = "0" + num;
    }
    if (postdecimal !== null) {
      for (let j = 0; j < 3 - postdecimal.length; j++) {
        num = num + "0";
      }
    }
    resStr += num + stdTdelim[i];
  }
  return resStr;
}

/**
 * Convert a T symbol into its T string.
 */
export function TtoStr(T: T): string {
  let tStr = "t:",
    dtStr = ",dt:";
  for (let i = 0; i < timeUnitOrder.length; i++) {
    const tUnit = timeUnitOrder[i];
    // if unit exist, write to str
    if (T.t?.[tUnit] !== undefined) {
      tStr += T.t[tUnit] + tUnit;
    }
    if (T.dt?.[tUnit] !== undefined) {
      dtStr += T.dt[tUnit] + tUnit;
    }
  }
  return tStr + dtStr;
}

/**
 * Delimit the array of timeChunk symbols by combining consecutive nulls (>3) into one, and dumping those shorter. Result is then delimited by 'trinull'.
 * @param  {Array} syms Of parsed symbols aka time chunks.
 * @return {Array}      symbols delimited by 'trinull'
 */
export function delimSyms(syms: Array<ParserSymbol | null>): Array<ParserSymbol | "trinull"> {
  // 1.
  // contract the nulls into trinulls in a single array
  const newSyms: Array<ParserSymbol | "trinull"> = [];
  let count = 0;
  for (let i = 0; i < syms.length; i++) {
    const s = syms[i];
    if (s === null) {
      count++;
    } else {
      if (count > 2) {
        newSyms.push("trinull");
      }
      newSyms.push(s);
      count = 0;
    }
  }
  return newSyms;
}

/**
 * Check if arr has symbol whose name is listen in symArr.
 * @param  {Array}  arr    Array of symbols.
 * @param  {Array}  symArr Array of symbol names.
 * @return {Boolean}
 */
export function hasSym(syms: Array<ParserSymbol>, symArr: Array<string>): boolean {
  let found = false;
  for (let i = 0; i < syms.length; i++) {
    if (isSym(syms[i], symArr)) {
      found = true;
      break;
    }
  }
  return found;
}

/**
 * Check if T.dt is not empty
 */
export function has_dt(T: T): boolean {
  return T.dt?.hasValues() ?? false;
}

/**
 * Check if T has only t, dt with units from timeUnitOrder
 */
export function has_pureTimeUnit(T: T): boolean {
  const dt = T.dt,
    t = T.t;
  let pure = true;
  for (const k in dt) {
    if (!_.includes(timeUnitOrder, k)) {
      pure = false;
      break;
    }
  }
  for (const k in t) {
    if (!_.includes(timeUnitOrder, k)) {
      pure = false;
      break;
    }
  }
  return pure;
}

/**
 * Check if T.t is not empty
 */
export function has_t(T: T): boolean {
  return T.t?.hasValues() ?? false;
}

/**
 * find the lowest overridable unit in t or dt
 */
export function highestOverride(t: t | dt): TimeObjectUnits | null {
  let lowestOverable = null;
  for (let i = 0; i < tOrdering.length; i++) {
    const unit = tOrdering[i];
    if (t[unit] !== undefined && /^=/.exec(t[unit])) {
      lowestOverable = unit;
      break;
    }
  }
  return lowestOverable;
}

/**
 * Check if arr has the symbol name of s.
 * @param  {symbol}  s   symbol object
 * @param  {Array}  arr Of string symbol names
 * @return {Boolean}
 */
export function isSym(s: string | ParserSymbol, arr: Array<string>): boolean {
  return typeof s === "string" ? false : _.includes(arr, sName(s));
}

/**
 * Find the largest enumerated unit in T.t, or if none, in T.dt
 */
export function largestUnit(T: T): TimeObjectUnits | null {
  let lu = _.find(tOrdering, function (unit) {
    return T.t?.[unit] !== undefined;
  });
  if (lu === null) {
    lu = _.find(tOrdering, function (unit) {
      return T.dt?.[unit] !== undefined;
    });
  }
  return lu;
}

type LemmaSymbolName = keyof typeof maps;

type LemmaSymbol =
  | {
      value: null;
      name: null;
      canon: string;
    }
  | {
      value: string;
      name: LemmaSymbolName;
      canon: string;
    };

/**
 * Return the lemma symbol of a word string, i.e. the name and value of the symbol it belongs to in the CFG. Uses ./maps.json.
 * NLP Lemmatization refers here: htp://nlp.stanford.edu/Ir-book/html/htmledition/stemming-and-lemmatization-1.html. Inflections = all possible alternative words of a lemma.
 * @param  {string} str To lemmatize.
 * @return {JSON}     Lemma symbol {name, value} for CFG
 * @example
 * lemma('zero')
 * // => { value: '0', name: 'n' }
 */
export function lemma(str: string): LemmaSymbol {
  // change all to lower case except for 'M' for month
  str = str == "M" ? str : str.toLowerCase();
  let name: LemmaSymbolName | null = null,
    value: string | null = null,
    canon = str;
  const mapsKeys = _.keys(maps) as Array<keyof typeof maps>;
  for (let i = 0; i < mapsKeys.length; i++) {
    const sMap = maps[mapsKeys[i]],
      sMapKeys = _.keys(sMap) as Array<keyof typeof sMap>;
    for (let j = 0; j < sMapKeys.length; j++) {
      const inflectionArr = sMap[sMapKeys[j]];
      if (_.includes(inflectionArr, str)) {
        // set the canonical form as the first in inflectionArr
        canon = inflectionArr[0];
        // if str is in inflections
        value = sMapKeys[j];
        break;
      }
    }
    if (value !== null) {
      name = mapsKeys[i];
      break;
    }
  }

  // return the lemma symbol
  return {
    name: name,
    value: value,
    canon: canon,
  } as LemmaSymbol;
}

/**
 * Find the next largest enumerated unit in T.t, or if none, in T.dt
 */
export function nextLargestUnit(T: T): TimeObjectUnits {
  const lu = largestUnit(T)!;
  return tOrdering[tOrdering.indexOf(lu) - 1];
}

/**
 * Convenient method to get current time in T format.
 * @return {string} T format string.
 */
export function nowT(offset?: Date | string): string {
  const dateStr = offset === undefined ? stdT(new Date()) : stdT(offset);
  return stdTtoT(dateStr);
}

/**
 * Determine the op type based on arguments
 */
export function opType(L: ParserSymbol | null, op: ParserSymbol, R: ParserSymbol | null): string {
  const LsName = sName(L) || "",
    RsName = sName(R) || "";
  let opsName = sName(op);
  if (opsName !== "o" && opsName !== "r" && opsName !== "c") {
    opsName = "";
  }
  return LsName + opsName + RsName;
}

/**
 * Order time chunks by not containing T, short to long, then containing T, short to long. Used for .pop() to get the candidate timechunk for parsing.
 */
export function orderChunks(matrix: Array<Array<ParserSymbol>>): Array<Array<ParserSymbol>> {
  // 2.
  // ok partition first then sort
  const hasNoT = matrix.filter(function (row) {
    return !hasSym(row, ["T"]);
  });
  const hasT = matrix.filter(function (row) {
    return hasSym(row, ["T"]);
  });
  // matrix, sorted short to long
  const lengthSortedNotTMat = hasNoT.sort(function (a, b) {
    return a.length - b.length;
  });
  const lengthSortedTMat = hasT.sort(function (a, b) {
    return a.length - b.length;
  });
  // 3.1 3.2 3.3
  return lengthSortedNotTMat.concat(lengthSortedTMat);
}

/**
 * !remove the defaul <o|op> that is 'plus' between <T>, <n> for defaulting to plus.
 * !is a quickfix for mat
 */
export function removeTnPlus(syms: Array<ParserSymbol>): Array<ParserSymbol> {
  for (let i = 0; i < syms.length; i++) {
    const s = syms[i];
    if (isSym(s, ["op"]) && s.value == "plus" && isSym(syms[i + 1], ["n"])) {
      syms.splice(i, 1);
    }
  }
  return syms;
}

/**
 * Return the name of a symbol: {op,c,r,n,T,f}
 * @param  {Symbol} symbol A CFG symbol.
 * @return {string}        name of the symbol.
 */
export function sName(symbol: string | ParserSymbol | null): string | null {
  return symbol?.constructor.name ?? null;
}

/**
 * Split a string by an array of tokens.
 * @param  {string} str       The input string.
 * @param  {Array} tokenArr Array of tokens to split the string by.
 * @return {Array}           The split string array.
 */
export function splitByArr(str: string, tokenArr: Array<string>): Array<string> {
  const delim = "#{REPLACE}";
  // inject into tokens
  for (let i = 0; i < tokenArr.length; i++) {
    const token = tokenArr[i];
    str = str.replace(token, delim);
  }
  // split into arr
  return str.split(delim);
}

/**
 * Split an array of symbols by delimiter into matrix.
 * @param  {Array} syms       The input array
 * @param  {string} delimiter To split the array by
 * @return {matrix}           delimited arrays.
 */
export function splitSyms(syms: Array<string | ParserSymbol>, delimiter: string): Array<Array<string | ParserSymbol>> {
  // split the single array into matrix
  const matrix: Array<Array<string | ParserSymbol>> = [];
  let newRow: Array<string | ParserSymbol> = [];
  for (let i = 0; i < syms.length; i++) {
    const s = syms[i];
    if (s == delimiter || sName(s) == delimiter) {
      // delimit and push to matrix
      matrix.push(newRow);
      newRow = [];
    } else if (i == syms.length - 1) {
      // edge case, push res
      newRow.push(s);
      matrix.push(newRow);
    } else {
      // accumulate in row
      newRow.push(s);
    }
  }
  return matrix;
}

type RawTimeObject = Partial<TimeObject> & { w?: string | number };

/**
 * Split a T string into array of [_y, _M, _d, _h, _m, _s]
 */
export function splitT(str: string): Array<string | number | undefined> | null {
  if (!str.match(reT)) {
    return null;
  }

  const _y = (/(\d+(\.\d+)?)y/.exec(str) || [])[1],
    _M = (/(\d+(\.\d+)?)M/.exec(str) || [])[1],
    _w = (/(\d+(\.\d+)?)w/.exec(str) || [])[1],
    _d = (/(\d+(\.\d+)?)d/.exec(str) || [])[1],
    _h = (/(\d+(\.\d+)?)h/.exec(str) || [])[1],
    _m = (/(\d+(\.\d+)?)m/.exec(str) || [])[1],
    _s = (/(\d+(\.\d+)?)s/.exec(str) || [])[1];

  // do the carries
  const TO = carry({
    y: _y,
    M: _M,
    w: _w,
    d: _d,
    h: _h,
    m: _m,
    s: _s,
  });

  // compose results
  const res = [];
  for (let i = 0; i < tOrdering.length; i++) {
    const k = tOrdering[i];
    res.push(TO[k]);
  }

  return res;
}

function safeParseFloat(val: string | number | undefined): number {
  return typeof val === "number" ? val : parseFloat(val || "0");
}

function safeParseInt(val: string | number | undefined): number {
  return typeof val === "number" ? Math.round(val) : parseInt(val || "0", 10);
}

/**
 * Function to properly down- and up- carry Time Object
 * 1. dumpweek, 2. carryDown, 3. carryUp
 */
function carry(TO: RawTimeObject): RawTimeObject {
  TO = dumpWeek(TO);
  TO = carryDown(TO);
  TO = carryUp(TO);
  return TO;
}

/**
 * 1. dumpWeek
 */
function dumpWeek(TO: RawTimeObject): RawTimeObject {
  const _w = safeParseFloat(TO["w"]),
    _d = safeParseFloat(TO["d"]);
  TO["d"] = _d + _w * 7;
  delete TO["w"];
  return TO;
}

/**
 * 2. carryDown
 */
function carryDown(TO: RawTimeObject): RawTimeObject {
  // shall reverse the ordering and factors for opp direction
  const ordering = tOrdering,
    factor = tFactor;
  let carry = 0;
  for (let i = 0; i < ordering.length; i++) {
    // the time unit in the ordering
    const u = ordering[i];
    // skip the rest of loopbody if this unit is undefined and nothing to carry
    if (TO[u] == undefined && carry == 0) {
      continue;
    }
    // carry
    TO[u] = safeParseFloat(TO[u]) + carry;
    // dont go in after the last one
    if (i == ordering.length - 1) {
      // overlong s decimal will be fixed in TtoStdT
      break;
    }
    const decimal = safeParseFloat(TO[u]) - safeParseInt(TO[u]);
    if (decimal > 0) {
      // set next carry
      carry = decimal * factor[i];
      // update current u
      TO[u] = safeParseInt(TO[u]);
    } else {
      // else reset to 0 if no carry
      carry = 0;
    }
  }
  return TO;
}

/**
 * 3. carryUp
 */
function carryUp(TO: RawTimeObject): RawTimeObject {
  // shall reverse the ordering and factors for opp direction
  const ordering = tOrdering.slice().reverse(),
    factor = tFactor.slice().reverse();
  let carry = 0;
  for (let i = 0; i < ordering.length; i++) {
    // the time unit in the ordering
    const u = ordering[i];
    // skip the rest of loopbody if this unit is undefined and nothing to carry
    if (TO[u] == undefined && carry == 0) {
      continue;
    }
    // carry
    TO[u] = safeParseFloat(TO[u]) + carry;
    // dont go in after the last one
    if (i == ordering.length - 1) {
      break;
    }
    const deci = safeParseInt(safeParseFloat(TO[u]) / factor[i]);
    if (deci > 0) {
      // set next carry
      carry = deci;
      // update current u
      TO[u] = safeParseFloat(TO[u]) % factor[i];
    } else {
      // else reset to 0 if no carry
      carry = 0;
    }
  }
  return TO;
}

/**
 * Take a date or string, parse it into standard format as yyyy-MM-dd hh:mm:ss.sss
 */
export function stdT(date: Date | string): string {
  if (typeof date === "string") {
    date = new Date(date);
  }
  const _y = date.getFullYear(),
    _M = date.getMonth() + 1,
    _d = date.getDate(),
    _date = [_y, _M, _d].join("-"),
    _time = /(\d\S+)/.exec(date.toTimeString())![1],
    format = _date + " " + _time;
  return format;
}

/**
 * Convert std time string to T string.
 * @example stdTtoT('2011-10-05T14:48:00.000') => 't:2011y10M05d14h48m00.000s,dt:'
 */
export function stdTtoT(str: string): string {
  const datetime = str.split(" ");
  const date = datetime[0].split("-"),
    time = datetime[1].split(":");
  return "t:" + date[0] + "y" + date[1] + "M" + date[2] + "d" + time[0] + "h" + time[1] + "m" + time[2] + "s,dt:";
}

/**
 * Recombine array of symbols back into str
 */
export function tokenToStr(syms: Array<ParserSymbol>): string {
  const tokens: Array<string> = [];
  for (let i = 0; i < syms.length; i++) {
    tokens.push(syms[i].token as string);
  }
  return tokens.join(" ");
}

/**
 * Extract unparsedTokens from str and parsed syms then join them
 */
export function unparsedStr(str: string, syms: Array<ParserSymbol>): string {
  const inputTokens = str.split(/\s+/);
  const tokens: Array<string> = [];
  for (let i = 0; i < syms.length; i++) {
    if (syms[i] == null) {
      tokens.push(inputTokens[i]);
    }
  }
  return tokens.join(" ");
}
