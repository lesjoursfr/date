// Production rule module for the CFG
// !leap year
// !proper carry considering # of days per month

/**
 * Module Dependencies
 */
import * as _ from "./subdash";
import symbol, { n, o, ParserSymbol, ParserSymbolUnits, T } from "./symbol";
import tokenize from "./tokenize";
import * as util from "./util";

// a partial implementation of norm
/**
 * Preprocess a string using the human language for time CFG, return a triple of original str, preprocessed tokens, and the normal forms (extracted dates in normal forms)
 */
export default function norm(str: string) {
  try {
    // Production rules: CFG algorithm for human language for time
    const tokObj = tokenize(str);
    // console.log('p#0: parse normal forms', tokObj)
    let syms: Array<ParserSymbol> = pickTokens(tokObj.symbols) || [];
    // console.log('p#0: remove nulls, pick tokens', syms)
    syms = reduce(syms, ["n", "n"]);
    // console.log('p#1: arithmetics: <n1>[<op>]<n2> ~ <n>, + if n1 > n2, * else', syms)
    syms = nTnRedistribute(syms);
    // console.log('p#2: redistribute, <n1><T1>[<op>]<n2><!T2> ~ <n1>[<op>]<n2> <T1>', syms)
    syms = reduce(syms, ["o", "o"]);
    // console.log('p#3: <o><o> ~ <o>*<o>', syms)

    // preprocessing ends, now format output
    const restored = restoreTokens(syms);
    return restored;
  } catch (_err) {
    return {
      str: str,
      tokens: [],
      normals: [],
    };
  }
}

/**
 * format a preprocessed array of symbols back into string
 */
function restoreTokens(syms: Array<ParserSymbol>) {
  const tokens = [],
    normals = [];

  syms = util.removeTnPlus(syms);
  for (let i = 0; i < syms.length; i++) {
    const s = syms[i],
      sName = util.sName(s);
    let token: string | { normal: string } = "";
    switch (sName) {
      case "n":
        // if token is already numeric, use it
        token = ((s as n).token as string).match(/^\s*[\d.\-+]+\s*$/)
          ? ((s as n).token as string).trim()
          : (s as n).value.toString();
        break;
      case "T":
        // handles shits like 1 am ~ t:1h00m,dt:, am (token returned)
        token = restoreNormal(s as T);
        break;
      default:
        // the other cases like op, o, cron, range
        token = s.token.toString();
    }

    // extract the protected normal string
    if (typeof token == "string") {
      tokens.push(token);
    } else {
      // get protected normal forms
      normals.push(token.normal);
    }
  }
  return {
    tokens: tokens,
    str: tokens.join(" ").replace(/\s+/g, " "),
    normals: normals,
  };
}

/**
 * Given a T symbol, try to restore its normal form (return wrapped in JSON if it's a complete date string {normal: <normal string>}), or just return the plain string as token
 */
function restoreNormal(T: T): string | { normal: string } {
  if ((T.token as string).match(util.reT)) {
    const token = T.token as string;
    // if it is normal form, convert back into the normal1 or normal2 strings
    const split = util.splitT(token)!;
    if (_.includes(split, undefined)) {
      // if it's normal2 form
      // either it's a date or time
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const dateArr = split.slice(0, 3),
        timeArr = split.slice(3);
      if (timeArr[0] != undefined) {
        // check time first, it's first signature (hour) is defined
        // return hh:mm
        return util.TtoStdT(token).match(/(\d+:\d+)/)![1];
      } else {
        // else it's a date, parse arr and return complete stdT instead
        // return wrapped in JSON if it's a complete date string
        return { normal: util.TtoStdT(token) };
      }
    } else {
      // if it's normal1 form, use TtoStd
      // return wrapped in JSON if it's a complete date string
      return { normal: util.TtoStdT(token) };
    }
  } else if (!util.has_t(T) && util.has_dt(T) && util.has_pureTimeUnit(T)) {
    // handle pure dt: T that are purel displacement, e.g. week, fortnight
    let dtStr = "";
    const units = _.keys(T.dt!) as Array<ParserSymbolUnits>,
      dt = T.dt!;
    // accumulate dtStr
    for (let i = 0; i < units.length; i++) {
      const u = units[i],
        kval = parseFloat(dt[u]!),
        // set number has default, or is 0, 1
        numStr =
          Number.isNaN(kval) || kval.toString() !== dt[u] || kval == 0 || Math.abs(kval) == 1
            ? ""
            : dt[u]!.toString() + " ";

      // set canon from lemma only if it exists, and key is word, else use u
      let canon: string = u;
      if (T.canon != undefined) {
        // and if it's also a timeUnit
        canon = T.canon;
      } else {
        // get the lemma for u, its canon and key
        const lemma = util.lemma(u),
          lemmaCanon = lemma.canon,
          lemmaKey = lemma.value;
        if (lemmaKey && lemmaKey.match(/^\w+$/)) {
          canon = lemmaCanon;
        }
      }
      // set the units, number, and canonical form of the unit
      dtStr = dtStr + numStr + canon + " ";
    }
    return dtStr;
  } else {
    // else it's just plain english, return
    return T.canon !== undefined ? T.canon : (T.token as string);
  }
}

/**
 * Production rule #0: pick tokens, remove nulls.
 * 1. break into chunks of arrs delimited by triple-null-or-more
 * 2. reorder chunks by arr length
 * 3.1 init candidate = []
 * 3.2 pull and push the chunks not containing <T> into candidate
 * 3.3 pull and push the chunks containing <T> into candidate
 * 4. pick the last candidate
 */
function pickTokens(syms: Array<ParserSymbol | null>): Array<ParserSymbol> | undefined {
  // 1. 2. 3.
  const delimited = util.delimSyms(syms),
    chunks = util.splitSyms(delimited, "trinull") as Array<Array<ParserSymbol>>,
    candidates = util.orderChunks(chunks);
  // 4.
  return candidates.pop();
}

/**
 * Reduce an array of symbols with binary operations between permissible symbols.
 * @param  {Array} syms   Array of input symbols
 * @param  {Array} varArr String names of permissible variables.
 * @param  {Array} opArr  String names of permissible operations.
 * @return {Array}        The reduced result.
 */
function reduce(syms: Array<ParserSymbol>, varArr: Array<string>, opArr?: Array<string>): Array<ParserSymbol> {
  if (syms.length < 2) {
    return syms;
  }

  // the operator arrays
  opArr = opArr || ["op"];
  // endmark for handling last symbol
  syms.push("null" as unknown as ParserSymbol);
  // the result, past-pointer(previous non-null symbol), default-op, current-op, and whether current-op is inter-symbol op, i.e. will not be used up
  const defOp = null;
  let res: Array<ParserSymbol> = [],
    past: Array<ParserSymbol> | ParserSymbol | null = null,
    op: ParserSymbol | null = defOp,
    interOp: boolean = false;
  for (let i = 0; i < syms.length; i++) {
    const s = syms[i];
    if (!past || !s) {
      // edge case or null
      if (i == 0) {
        past = s;
      }
    } else if (util.isSym(s, opArr)) {
      // s is an op. mark op as won't be used yet
      op = s as ParserSymbol;
      interOp = true;
      // the nDefT for when past = 'n', s = 'o'
    } else if (util.isSym(past as ParserSymbol, [varArr[0]]) && util.isSym(s, [varArr[1]])) {
      // s and past are operable variables specified by varArr
      past = execOp(past as ParserSymbol, op!, s);
      // reset after op is used
      op = defOp;
      interOp = false;
    } else {
      // no further legal operation made, push and continue
      // change of class, past is finalized, push to res
      res.push(past as unknown as ParserSymbol);
      if (Array.isArray(past)) {
        // if past was returned from execOp as array (not executed), then flatten it and dont push op to res, since it's already included in op
        res = _.flatten(res);
      } else {
        // if inter-op (not used), push a clone (prevent overwrite later)
        if (interOp) {
          res.push(symbol(op!.value as string)!);
        }
      }
      // reset
      op = defOp;
      interOp = false;
      past = s;
    }
  }
  return res;
}

/**
 * Execute non-commutative operation between 2 argument symbols and an op symbol; carry out respective ops according to symbol names.
 * @param  {symbol} L  Left argument
 * @param  {symbol} op operation
 * @param  {symbol} R  Right argument
 * @param  {str} offset The time origin offset
 * @return {symbol}    Result
 */
function execOp(
  L: ParserSymbol,
  op: ParserSymbol,
  R: ParserSymbol,
  offset?: string
): Array<ParserSymbol> | ParserSymbol {
  const otype = util.opType(L, op, R);
  let res = null;
  if (_.includes(["nn"], otype)) {
    res = nnOp(L as n, op, R as n);
  } else if (_.includes(["nT"], otype)) {
    res = nTOp(L as n, op, R as T);
  } else if (_.includes(["TT"], otype)) {
    res = TTOp(L as T, op, R as T);
  } else if (_.includes(["ToT", "oT", "To"], otype)) {
    res = ToTOp(L as T, op, R as T, offset);
  } else if (_.includes(["oo"], otype)) {
    res = ooOp(L as o, R as o);
  } else if (_.includes(["rT", "TrT"], otype)) {
    // has optional arg
    res = rTOp(L, R);
  } else if (_.includes(["cT", "fcT", "crT", "fcrT"], otype)) {
    // has optional arg
    res = cTOp(L, R);
  } else {
    // not executable, e.g. not in the right order, return fully
    res = op == null ? [L, R] : [L, op, R];
  }
  return res;
}

/**
 * Atomic binary arithmetic operation on the numerical level, with default overriding the argument prepended with '='.
 * @param  {string|Number} Lval The left argument value.
 * @param  {symbol}        op The op symbol
 * @param  {string|Number} Rval The right argument value.
 * @return {string|Number} Result from the operation.
 */
function atomicOp(Lval: string | number, op: ParserSymbol, Rval: string | number, dontOp?: boolean): string | number {
  dontOp = dontOp || false;
  const oName = op.value;
  if (Lval == undefined) {
    // if L is missing, R must exist tho
    return oName == "minus" ? Rval.toString().replace(/(\d)/, "-$1") : Rval;
  }
  if (Rval == undefined) {
    // if L exists, be it def or not, R missing
    return Lval;
  }

  // or R exist or is default (parse to NaN), L can be default too but ignore then
  const defL = Lval.toString().match(/^=/),
    defR = Rval.toString().match(/^=/);
  const l = parseFloat(Lval.toString().replace(/^=/, "")),
    r = parseFloat(Rval.toString().replace(/^=/, ""));
  if (defL && defR) {
    // if both are default, return r 'last come last serve'
    return r;
  }
  if (defL && !defR) {
    // if either default, return the non-default
    return r;
  }
  if (!defL && defR) {
    return l;
  }

  // none default
  if (dontOp) {
    // if is a don't operate together, i.e. for t, just return l
    // 'first come first serve'
    return l;
  }

  // make the into proper floats first
  if (oName == "minus") {
    return l - r;
  } else if (oName == "plus") {
    return l + r;
  } else if (oName == "times") {
    return l * r;
  } else if (oName == "divide") {
    return l / r;
  }

  throw new Error(`Unkown oName: ${oName}!`);
}

/**
 * p#1: arithmetics: <n1>[<op>]<n2> ~ <n>, + if n1 > n2, * else
 */
function nnOp(L: n, op: ParserSymbol, R: n): ParserSymbol {
  const l = L.value,
    r = R.value;
  // set the default op according to value in nn op
  if (l > r) {
    op = op || symbol("plus");
  } else {
    op = op || symbol("times");
  }
  const res = atomicOp(l, op, r);
  return symbol(res)!;
}

/**
 * p#2: redistribute, <n1><T1>[<op>]<n2><!T2> ~ <n1>[<op>]<n2> <T1>
 * algorithm: note that from previous steps no <n>'s can occur adjacently
 * 1. scan array L to R, on each <n> found:
 * 2.1 if its R is <T>, continue
 * 2.2 else, this is the target. do:
 * 3.1 init carry = []. remove and push <n> into carry,
 * 3.2 if its L is <op>, remove and prepend <op> into carry,
 * 4.1 find the first <n> to the left, if not <n>, drop the carry and continue
 * 4.2 else merge the carry after the <n>
 * 5. At the end of loop, rerun production rule #1
 */
function nTnRedistribute(syms: Array<ParserSymbol>): Array<ParserSymbol> {
  if (syms.length < 2) {
    return syms;
  }
  // 1.
  for (let i = 0; i < syms.length; i++) {
    const s = syms[i];
    if (util.sName(s) != "n") {
      continue;
    }
    // 1.

    const R = syms[i + 1];
    if (util.sName(R) == "T") {
      continue;
    }
    // 2.2

    // 3.1 prepare the carry
    const carry = [];
    // 3.2 the Left symbol
    const L = syms[i - 1];
    let Li = -1;
    if (util.sName(L) == "op") {
      // if L is an 'op', remember to pull it later
      Li = i - 1;
    }
    // 4.1
    // find L...L of L that is 'n'
    const LLi = _.findLastIndex(syms.slice(0, i - 1), function (Ls) {
      return util.sName(Ls) == "n";
    });
    if (!syms[LLi] || util.sName(syms[LLi + 1]) != "T") {
      // if can't find 'n' (index = -1), or the R of 'n' isn't T, abort mission
      // syms.splice(i, 0, carry)
    } else {
      // 4.2
      // else, pull s at [i], optional L at [Li], and push at LLi+1
      carry.push(_.pullAt(syms, i)[0]);
      if (Li != -1) {
        carry.unshift(_.pullAt(syms, Li)[0]);
      }
      syms.splice(LLi + 1, 0, ...carry);
    }
  }

  // 5. redo the <n><n> op
  syms = reduce(syms, ["n", "n"]);
  return syms;
}

/**
 * p#3: <n>[<op>]<T> ~ <T>, * if dt, + if t
 * 1. if t can be overidden, start from the highest unit set to n, then return.
 * 2. otherwise, if <dt> not empty, <n><dt> = <n>*<dt>, then return
 * 3. else, if <t> not empty, <n><t> = <n>+<t>, then return
 */
function nTOp(nL: n, op: ParserSymbol, TR: T): ParserSymbol {
  const tOverrideUnit = util.highestOverride(TR.t!);
  if (tOverrideUnit) {
    // 1.
    TR.t![tOverrideUnit] = nL.value.toString(); // TODO ?????
  } else if (_.keys(TR.dt!).length) {
    // 2.
    op = op || symbol("times");
    for (const k in TR.dt) {
      if (k == "wd") {
        continue;
      }
      TR.dt![k as ParserSymbolUnits] = atomicOp(nL.value, op, TR.dt![k as ParserSymbolUnits]!) as string;
    }
  } else if (_.keys(TR.t!).length) {
    // 3.
    op = op || symbol("plus");
    for (const k in TR.t) {
      TR.t![k as ParserSymbolUnits] = atomicOp(nL.value, op, TR.t![k as ParserSymbolUnits]!) as string;
    }
  }
  return TR;
}

/**
 * p#4: <T>[<op>]<T> ~ <T>
 */
function TTOp(TL: T, op: ParserSymbol, TR: T): ParserSymbol {
  // set the default op
  op = op || symbol("plus");
  // util.sName
  // mutate into TL
  for (const k in TR.t) {
    // okay done add absolute time, just as you don't add origins together put u take gradual specificity, the 'true' param for dontOp if exist, return r
    // override default tho, taken care of by atomic
    TL.t![k as ParserSymbolUnits]! = atomicOp(
      TL.t![k as ParserSymbolUnits]!,
      op,
      TR.t![k as ParserSymbolUnits]!,
      true
    ) as string;
  }
  for (const k in TR.dt) {
    if (k == "wd") {
      continue;
    }
    TL.dt![k as ParserSymbolUnits]! = atomicOp(
      TL.dt![k as ParserSymbolUnits]!,
      op,
      TR.dt![k as ParserSymbolUnits]!
    ) as string;
  }
  return TL;
}

/**
 * <o><o> ~ <o>*<o>
 * To handle 'before next' etc.
 */
function ooOp(L: o, R: o): ParserSymbol {
  const Lsign = L.value == "plus" ? +1 : -1,
    Rsign = R.value == "plus" ? +1 : -1,
    LRsign = Lsign * Rsign;
  return LRsign > 0 ? symbol("after")! : symbol("before")!;
}

/**
 * Next available T', given an offset, by incrementing in dt the next unit ++1 from the current largest unit in t.
 */
function nextAvailable(T: T, offset?: string): T {
  // find the current largest and next largest unit
  const nextUnit = util.nextLargestUnit(T);

  // first finalized T
  const finT1 = finalizeT([T], offset)[0] as T,
    stdStr1 = util.TtoStdT(finT1),
    UTC1 = Date.parse(stdStr1),
    UTCnow = Date.now(),
    UTCdiff = UTC1 - UTCnow;
  // if UTC1 is not in the future, add next unit
  if (UTCdiff < 0) {
    T.dt![nextUnit] = (((T.dt![nextUnit] as unknown as number) || 0) + 1).toString();
    const finT2 = finalizeT([T], offset)[0] as T;
    return finT2;
  } else {
    return finT1;
  }
}

/**
 * p#6: <T><o><T> ~ <T>
 */
function ToTOp(L: T, op: ParserSymbol, R: T, offset?: string): ParserSymbol {
  if (L && !R) {
    // if R is missing, set to now
    R = symbol(util.nowT(offset)) as T;
  } else if (!L && R) {
    // if L missing
    if (util.has_t(R)) {
      // if R has t => part of origin, so L shd be the according dt
      const nextUnit = util.nextLargestUnit(R);
      R = nextAvailable(R, offset) as T;
      // so arbitrarily set as 0.5 * next largest unit
      L = execOp(symbol(0.5)!, symbol("times")!, symbol(nextUnit)!) as T;
    } else {
      // R has dt only, make L an origin then
      L = symbol(util.nowT(offset)) as T;
    }
  } else if (!L && !R) {
    L = symbol(util.nowT(offset)) as T;
    R = symbol(util.nowT(offset)) as T;
  }

  const Ttype: Array<"t" | "dt"> = ["t", "dt"];
  for (let i = 0; i < Ttype.length; i++) {
    const _Ttype = Ttype[i],
      // the dontOp for 't'
      dontOp = _Ttype == "t";
    const concatKeys = _.keys(L[_Ttype]!).concat(_.keys(R[_Ttype]!)) as Array<ParserSymbolUnits>;
    const keys = _.unique(concatKeys);
    for (let j = 0; j < keys.length; j++) {
      const k = keys[j];
      // run atomic op, note the reversed order of R op L
      R[_Ttype]![k] = atomicOp(R[_Ttype]![k]!, op, L[_Ttype]![k]!, dontOp) as string;
    }
  }
  return R;
}

/**
 * p#8: Finalize each T in syms array:
 * 1. remove defaults from T
 * 2. add origin symbol.nowT() with given T.t, override missing units
 * 3. add t and dt
 */
function finalizeT(syms: Array<ParserSymbol>, offset?: string): Array<ParserSymbol> {
  // remove defaults
  for (let i = 0; i < syms.length; i++) {
    syms[i] = removeDefaults(syms[i] as T);
  }
  // default with origin at end
  syms.push(symbol(util.nowT(offset)) as T);
  syms = reduce(syms, ["T", "T"]);
  // combine t and dt
  const newSyms = [];
  for (let i = 0; i < syms.length; i++) {
    const s = syms[i],
      sum = tdtAdd(s);
    sum.token = util.TtoStr(sum as T);
    newSyms.push(tdtAdd(s));
  }
  return syms;
}

/**
 * remove the defaults before adding with origin
 */
function removeDefaults(T: T) {
  for (const k in T.dt) {
    T.dt[k as ParserSymbolUnits] = T.dt[k as ParserSymbolUnits]?.toString().replace(/^=/, "");
  }
  for (const k in T.t) {
    T.t[k as ParserSymbolUnits] = T.t[k as ParserSymbolUnits]?.toString().replace(/^=/, "");
  }
  // delete meridiem too
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (T.t as any).mer;

  return T;
}

/**
 * add t and dt within a T together, delete the dt keys
 */
function tdtAdd(T: ParserSymbol): ParserSymbol {
  // guard for non-T
  if (!util.isSym(T, ["T"])) {
    return T;
  }
  for (const k in (T as T).dt) {
    // absolute add, disregard defaults
    let t_k = (T as T).t![k as ParserSymbolUnits] === undefined ? 0 : (T as T).t![k as ParserSymbolUnits]!,
      dt_k = (T as T).dt![k as ParserSymbolUnits]!;
    // cleanup the default
    t_k = t_k.toString().replace(/^=/, "");
    dt_k = dt_k.toString().replace(/^=/, "");
    const sum = parseFloat(t_k) + parseFloat(dt_k);
    // set the result, remove used dt
    (T as T).t![k as ParserSymbolUnits] = sum.toString();
    delete (T as T).dt![k as ParserSymbolUnits];
  }
  return T;
}

/**
 * !to be implemented for range
 */
function rTOp(L: ParserSymbol, R: ParserSymbol): ParserSymbol {
  let start, end;
  if (!R) {
    start = symbol(util.nowT())!;
    end = L;
  } else {
    start = L;
    end = R;
  }
  return symbol({ start: start, end: end })!;
}

/**
 * !to be implemented for cron
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function cTOp(L: ParserSymbol, R: ParserSymbol): ParserSymbol {
  throw new Error("Not implemented!");
}
