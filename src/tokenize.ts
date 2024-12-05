// Module to tokenize a string into CFG symbols

/**
 * Module Dependencies
 */
import symbol, { ParserSymbol } from "./symbol";
import * as util from "./util";

/**
 * regexes for Subnormal forms
 */
const re = {
  // 12/20 - 12/21, 2012/12 - 2013/12
  MMsDDdMMsDD: /(?!\d{1,4}\/\d{1,4}\s*-\s*\d{1,4}\/\d{1,4}\/)(\d{1,4})\/(\d{1,4})\s*-\s*(\d{1,4})\/(\d{1,4})/g,
  // 12/22 - 23, 2012/10 - 12
  MMsDDdDD: /(?!\d{1,4}\/\d{1,4}\s*-\s*\d{1,4}\/)(\d{1,4})\/(\d{1,4})\s*-\s*(\d{1,4})/g,
  // 12/24, 2012/12
  MMsDD: /(?!\d{1,4}\/\d{1,4}\/)(\d{1,4})\/(\d{1,4})/g,
  // 05:30pm, 0530pm, 1730, 1730pm, 1730[re:h], remove the [re:h]
  hhcmm: /(\s+\d{1,2}|^\d{1,2}):?(\d{2})\s*(\S+)*/g,
};

/**
 * Parse and tokenize a string into array of valid CFG symbols, in these steps:
 * 1. parse normal forms
 * 2. parse subnormal forms
 * 3. parse english forms
 * @param  {String} str The input string.
 * @return {JSON}     {str, tokensIn, tokensOut, symbols}
 */
export default function tokenize(str: string): {
  str: string;
  tokensOut: Array<string>;
  tokensIn: Array<string>;
  symbols: Array<ParserSymbol | null>;
} {
  // split num from alphabets
  str = (" " + str)
    .replace(/\s+(\d+)([a-zA-Z]+)/g, " $1 $2")
    .replace(/\s+([a-zA-Z]+)(\d+)/g, " $1 $2")
    .replace(/\s+/g, " ")
    .replace(/^\s+/, "");
  // 1. 2. parse normal and subnormal forms
  const p = parseNormal12(str),
    pStr = p.str,
    tokens = pStr.split(" "),
    symbols: Array<ParserSymbol | null> = [];
  // clean the non-normal tokens a bit, allow to be wrapped by words only
  for (let i = 0; i < tokens.length; i++) {
    if (!tokens[i].match(util.reT)) {
      tokens[i] = tokens[i].replace(/^\W+/, "").replace(/\W+$/, "");
    }
  }

  // 3. parse english forms
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    const oneGram = tok,
      twoGram = tok + " " + (tokens[i + 1] || ""),
      oneSym = symbol(oneGram),
      twoSym = symbol(twoGram);
    if (twoSym && twoSym.value === oneSym?.value) {
      // if lemmatization must happen for both,
      // pick the longer, skip next token
      // skip this once, reset skip
      i++;
      symbols.push(symbol(twoGram));
    } else {
      symbols.push(symbol(oneGram));
    }
  }
  return {
    str: pStr,
    tokensOut: p.tokensOut,
    tokensIn: p.tokensIn,
    symbols: symbols,
  };
}

/**
 * Run 1. parseNormal then 2. parseNormal2, return the parsed string with T-format tokens.
 * @private
 * @param  {string} str The input string
 * @return {JSON}     Parsed string
 */
function parseNormal12(str: string): { str: string; tokensOut: Array<string>; tokensIn: Array<string> } {
  const p1 = parseNormal1(str);
  // find tokens that are purely normal, and reinject into string
  const p1TokensOut = p1.tokensOut.filter(notSubnormal);
  const p1Str = injectNormal(str, p1TokensOut);
  // now parse the subnormal
  const p2 = parseNormal2(p1Str, [], []);
  // the tokens that taken out, and their replacements, in order
  const pTokensOut = p1.tokensOut.concat(p2.tokensOut);
  const pTokensIn = p1.tokensIn.concat(p2.tokensIn);
  return {
    str: p2.str,
    tokensOut: pTokensOut,
    tokensIn: pTokensIn,
  };
}

/**
 * 1. Parse normal forms. Try to parse and return a normal Date, parseable from new Date(str), by continuously trimming off its tail and retry until either get a valid date, or string runs out.
 * Doesn't parse string with length <5
 */
function parseNormal1(str: string): { tokensIn: Array<string>; tokensOut: Array<string> } {
  // keep chopping off tail until either get a valid date, or string runs out
  // array of parsed date and the string consumed
  const tokensIn: Array<string> = [],
    tokensOut: Array<string> = [];
  // ensure single spacing
  str = str.replace(/\s+/g, " ");
  // tokenize by space
  const strArr = str.split(/\s+/g);

  // init the normalDate and head string used
  let normalDate: string | null = null,
    head = "";
  // do while there's still string to go
  while (strArr.length) {
    head = (head + " " + strArr.shift()).trim();
    try {
      normalDate = util.stdT(new Date(head));
      // Extend head: if parse successful, extend continuously until failure, then that's the longest parseable head string, ...<date>
      let advanceHead = head + " " + strArr[0];
      while (true) {
        try {
          const advanceDate = util.stdT(new Date(advanceHead));
          if (advanceDate != "Invalid Date") {
            // if advanceDate is parseable, set to current, update heads
            head = head + " " + strArr.shift();
            advanceHead = advanceHead + " " + strArr[0];
          } else {
            break;
          }
        } catch (_err) {
          // when fail, just break
          break;
        }
      }
      // Shrink head: from the whole parseable head ...<date>, trim front till we get <date>
      while (true) {
        try {
          if (util.stdT(new Date(head.replace(/^\s*\S+\s*/, ""))) != normalDate) {
            // front token eaten causes change, dont update head
            break;
          } else {
            // update head
            head = head.replace(/^\s*\S+\s*/, "");
          }
        } catch (_err) {
          break;
        }
      }
      // only consider a valid parse if the parsed str is long enough
      if (head.length > 6) {
        tokensIn.push(normalDate);
        // get head = <date> only, then reset
        tokensOut.push(head);
      }
      head = "";
    } catch (_err) {
      // when fail, do nothing
    }
  }
  return { tokensIn: tokensIn, tokensOut: tokensOut };
}

/**
 * 2. Parse subnormal forms after parseNormal. Gradually replace tokens of the input string while parseable.
 * @private
 */
function parseNormal2(
  str: string,
  tokensIn: Array<string>,
  tokensOut: Array<string>
): { str: string; tokensOut: Array<string>; tokensIn: Array<string> } {
  let m, res;
  if ((m = re.MMsDDdMMsDD.exec(str))) {
    // 12/20 - 12/21
    const yMd1 = yMdParse(m[1], m[2]);
    const yMd2 = yMdParse(m[3], m[4]);
    res = " t:" + yMd1 + ",dt: - t:" + yMd2 + ",dt: ";
  } else if ((m = re.MMsDDdDD.exec(str))) {
    // 12/22 - 23
    const yMd1 = yMdParse(m[1], m[2]);
    const yMd2 = yMdParse(m[1], m[3]);
    res = " t:" + yMd1 + ",dt: - t:" + yMd2 + ",dt: ";
  } else if ((m = re.MMsDD.exec(str))) {
    // if year
    const yMd = yMdParse(m[1], m[2]);
    // 12/24
    res = " t:" + yMd + ",dt: ";
  } else if ((m = re.hhcmm.exec(str))) {
    // 05:30pm, 0530pm, 1730, 1730pm, 1730[re:h], remove the [re:h]
    res = " t:" + m[1].trim() + "h" + m[2] + "m" + ",dt: " + (m[3] || "");
  } else {
    // exit recursion if hits here
    return {
      str: str,
      tokensIn: tokensIn,
      tokensOut: tokensOut,
    };
  }
  // recurse down till no more substitution (CFG is not cyclic, so ok)
  tokensOut.push(m[0]);
  tokensIn.push(res);
  str = parseNormal2(str.replace(m[0], res), tokensIn, tokensOut).str;
  return {
    str: str,
    tokensIn: tokensIn,
    tokensOut: tokensOut,
  };
}

// ////////////////////
// Helper functions //
// ////////////////////
/**
 * Try to parse two tokens for T form into MM/dd, or MM/yyyy if either token hsa length 4.
 * @private
 * @param  {string} token1
 * @param  {string} token2
 * @return {string}        in the form <y><M><d>
 */
function yMdParse(token1: string, token2: string): string {
  const part0 = [token1, token2].filter(function (token) {
    return token.length === 4;
  });
  const part1 = [token1, token2].filter(function (token) {
    return token.length !== 4;
  });
  const y = part0[0] ? part0[0] + "y" : "";
  const M = part1[0] + "M";
  const d = part1[1] ? part1[1] + "d" : "";
  return y + M + d;
}

/**
 * Check if the dateStr is strictly normal and not subnormal. Used to extract parseNormal2 overrides.
 * @private
 * @param  {string} dateStr
 * @return {Boolean}
 */
function notSubnormal(dateStr: string): boolean {
  const subnormalStr = parseNormal2(dateStr, [], []).str;
  // remove T and see if still has words
  const noT = subnormalStr.replace(/t:\S*,dt:\S*(\s*-\s*t:\S*,dt:\S*)?/, "");
  return /\w+/g.exec(noT) !== null;
}

/**
 * Given a string and array of its parsed phrases, convert them into T stdT then T format, and inject into the original string, return.
 * @private
 * @param  {string} str       The original string.
 * @param  {Array} parsedArr The parsed phrases from the string.
 * @return {string}           The string with parsed phrases replaced in T format.
 *
 * @example
 * injectNormal('05 October 2011 14:48 UTC 08/11 2020', [ '05 October 2011 14:48 UTC', '08/11 2020' ])
 * // => 't:2011y10M05d14h48m00.000s,dt: t:2020y08M11d04h00m00.000s,dt: '
 */
function injectNormal(str: string, parsedArr: Array<string>): string {
  for (let i = 0; i < parsedArr.length; i++) {
    const parsed = parsedArr[i];
    const T = util.stdTtoT(util.stdT(new Date(parsed)));
    str = str.replace(parsed, T);
  }
  return str;
}
