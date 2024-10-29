/**
 * Module Dependencies
 */
import { notStrictEqual, strictEqual } from "assert";
import parse from "../src/index";

/**
 * Some predefined dates
 */
const mon = new Date("May 13, 2013 01:30:00");

/**
 * Test parser
 */

/**
 * Minutes
 */
describe("minutes", function () {
  it("10m", function () {
    const date = parse("10m", mon);
    strictEqual(t(date), "1:40:00");
    strictEqual(d(date), "5/13/13");
  });

  it("10min", function () {
    const date = parse("10min", mon);
    strictEqual(t(date), "1:40:00");
    strictEqual(d(date), "5/13/13");
  });

  it("10 minutes", function () {
    const date = parse("10 minutes", mon);
    strictEqual(t(date), "1:40:00");
    strictEqual(d(date), "5/13/13");
  });

  it("10 minutes from now", function () {
    const date = parse("10 minutes from now", mon);
    strictEqual(t(date), "1:40:00");
    strictEqual(d(date), "5/13/13");
  });

  it("10 minutes starting tomorrow", function () {
    const date = parse("10 minutes starting tomorrow", mon);
    strictEqual(t(date), "1:40:00");
    strictEqual(d(date), "5/14/13");
  });
});

/**
 * Hours
 */
describe("hours", function () {
  it("in 5 hours", function () {
    const date = parse("in 5 hours", mon);
    strictEqual(t(date), "6:30:00");
    strictEqual(d(date), "5/13/13");
  });

  it("5 hours later", function () {
    const date = parse("5 hours later", mon);
    strictEqual(t(date), "6:30:00");
    strictEqual(d(date), "5/13/13");
  });

  it("in 5h", function () {
    const date = parse("in 5h", mon);
    strictEqual(t(date), "6:30:00");
    strictEqual(d(date), "5/13/13");
  });

  it("in 5hrs", function () {
    const date = parse("in 5hrs", mon);
    strictEqual(t(date), "6:30:00");
    strictEqual(d(date), "5/13/13");
  });

  it("at 5am", function () {
    const date = parse("5am", mon);
    strictEqual(t(date), "5:00:00");
    strictEqual(d(date), "5/13/13");
  });

  it("at 5pm", function () {
    const date = parse("5pm", mon);
    strictEqual(t(date), "17:00:00");
    strictEqual(d(date), "5/13/13");
  });

  it("at5", function () {
    const date = parse("at5", mon);
    strictEqual(t(date), "5:00:00");
    strictEqual(d(date), "5/13/13");
  });

  it("at 17", function () {
    const date = parse("at 17", mon);
    strictEqual(t(date), "17:00:00");
    strictEqual(d(date), "5/13/13");
  });

  it("at 12:30", function () {
    const date = parse("at 12:30", mon);
    strictEqual(t(date), "12:30:00");
    strictEqual(d(date), "5/13/13");
  });

  it("at 12.30", function () {
    const date = parse("at 12.30", mon);
    strictEqual(t(date), "12:30:00");
    strictEqual(d(date), "5/13/13");
  });

  it("at 23:35", function () {
    const date = parse("at 23:35", mon);
    strictEqual(t(date), "23:35:00");
    strictEqual(d(date), "5/13/13");
  });

  it("at 0:30", function () {
    const date = parse("at 0:30", mon);
    strictEqual(t(date), "0:30:00");
    strictEqual(d(date), "5/14/13");
  });
});

/**
 * Days
 */
describe("days", function () {
  it("in 2 days", function () {
    const date = parse("in 2 days", mon);
    strictEqual(t(date), "1:30:00");
    strictEqual(d(date), "5/15/13");
  });

  it("in 2d", function () {
    const date = parse("in 2d", mon);
    strictEqual(t(date), "1:30:00");
    strictEqual(d(date), "5/15/13");
  });
});

/**
 * Dates
 */
describe("dates", function () {
  it("tuesday at 9am", function () {
    const date = parse("tuesday at 9am", mon);
    strictEqual(t(date), "9:00:00");
    strictEqual(d(date), "5/14/13");
  });

  it("monday at 9am", function () {
    const date = parse("monday at 9am", mon);
    strictEqual(t(date), "9:00:00");
    strictEqual(d(date), "5/13/13");
  });

  it("Monday at 9am", function () {
    const date = parse("Monday at 9am", mon);
    strictEqual(t(date), "9:00:00");
    strictEqual(d(date), "5/13/13");
  });

  it("monday at 9", function () {
    const date = parse("monday at 9", mon);
    strictEqual(t(date), "9:00:00");
    strictEqual(d(date), "5/13/13");
  });

  it("monday at 21", function () {
    const date = parse("monday at 21", mon);
    strictEqual(t(date), "21:00:00");
    strictEqual(d(date), "5/13/13");
  });

  it("monday at 1:00am", function () {
    const date = parse("monday at 1:00am", mon);
    strictEqual(t(date), "1:00:00");
    strictEqual(d(date), "5/20/13");
  });

  it("next monday at 1:00am", function () {
    const date = parse("next monday at 1:00am", mon);
    strictEqual(t(date), "1:00:00");
    strictEqual(d(date), "5/20/13");
  });

  it("last monday at 1:00am", function () {
    const date = parse("last monday at 1:00am", mon);
    strictEqual(t(date), "1:00:00");
    strictEqual(d(date), "5/6/13");
  });
});

/**
 * Tomorrow
 */
describe("tomorrow", function () {
  it("tomorrow at 3pm", function () {
    const date = parse("tomorrow at 3pm", mon);
    strictEqual(t(date), "15:00:00");
    strictEqual(d(date), "5/14/13");
  });

  it("tmr at 3pm", function () {
    const date = parse("tmr at 3pm", mon);
    strictEqual(t(date), "15:00:00");
    strictEqual(d(date), "5/14/13");
  });
});

/**
 * Yesterday
 */
describe("yesterday", function () {
  it("yesterday at 3pm", function () {
    const date = parse("yesterday at 3pm", mon);
    strictEqual(t(date), "15:00:00");
    strictEqual(d(date), "5/12/13");
  });

  it("ytd at 3pm", function () {
    const date = parse("ytd at 3pm", mon);
    strictEqual(t(date), "15:00:00");
    strictEqual(d(date), "5/12/13");
  });

  it("yesterday at 15", function () {
    const date = parse("yesterday at 15", mon);
    strictEqual(t(date), "15:00:00");
    strictEqual(d(date), "5/12/13");
  });

  it("yesterday at 12:30am", function () {
    const date = parse("yesterday at 12:30am", mon);
    strictEqual(t(date), "0:30:00");
    strictEqual(d(date), "5/12/13");
  });
});

/**
 * Tonight
 */
describe("tonight", function () {
  it("5pm tonight", function () {
    const date = parse("5pm tonight", mon);
    strictEqual(t(date), "17:00:00");
    strictEqual(d(date), "5/13/13");
  });

  it("tonight at 5pm", function () {
    const date = parse("tonight at 5pm", mon);
    strictEqual(t(date), "17:00:00");
    strictEqual(d(date), "5/13/13");
  });

  it("tonight at 5", function () {
    const date = parse("tonight at 5", mon);
    strictEqual(t(date), "17:00:00");
    strictEqual(d(date), "5/13/13");
  });

  it("tonight at 5:30", function () {
    const date = parse("tonight at 5:30", mon);
    strictEqual(t(date), "17:30:00");
    strictEqual(d(date), "5/13/13");
  });
});

/**
 * Midnight
 */
describe("mightnight", function () {
  it("midnight", function () {
    const date = parse("midnight", mon);

    strictEqual(t(date), "0:00:00");
    strictEqual(d(date), "5/14/13");
  });

  it("tomorrow at midnight", function () {
    const date = parse("tomorrow at midnight", mon);
    strictEqual(t(date), "0:00:00");
    strictEqual(d(date), "5/14/13");
  });

  it("midnight (@ 1:30pm)", function () {
    const afternoon = new Date("May 13, 2013 13:30:00");
    const date = parse("midnight", afternoon);
    strictEqual(t(date), "0:00:00");
    strictEqual(d(date), "5/14/13");
  });
});

/**
 * Noon
 */
describe("noon", function () {
  it("noon", function () {
    const date = parse("noon", mon);
    strictEqual(t(date), "12:00:00");
    strictEqual(d(date), "5/13/13");
  });

  it("tomorrow at noon", function () {
    const date = parse("tomorrow at noon", mon);
    strictEqual(t(date), "12:00:00");
    strictEqual(d(date), "5/14/13");
  });

  it("noon (@ 1:30pm)", function () {
    const afternoon = new Date("May 13, 2013 13:30:00");
    const date = parse("noon", afternoon);
    strictEqual(t(date), "12:00:00");
    strictEqual(d(date), "5/14/13");
  });
});

/**
 * Weeks
 */
describe("weeks", function () {
  it("next week tuesday", function () {
    const date = parse("next week tuesday", mon);
    strictEqual(t(date), "1:30:00");
    strictEqual(d(date), "5/21/13");
  });

  it("next w tuesday", function () {
    const date = parse("next w tuesday", mon);
    strictEqual(t(date), "1:30:00");
    strictEqual(d(date), "5/21/13");
  });

  it("next wk tuesday", function () {
    const date = parse("next wk tuesday", mon);
    strictEqual(t(date), "1:30:00");
    strictEqual(d(date), "5/21/13");
  });

  it("next week tuesday at 4:30pm", function () {
    const date = parse("next week tuesday at 4:30pm", mon);
    strictEqual(t(date), "16:30:00");
    strictEqual(d(date), "5/21/13");
  });

  it("2 weeks from wednesday", function () {
    const date = parse("2 weeks from wednesday", mon);
    strictEqual(t(date), "1:30:00");
    strictEqual(d(date), "5/29/13");
  });
});

/**
 * Night
 */
describe("night", function () {
  it("night", function () {
    const date = parse("night", mon);
    strictEqual(t(date), "19:00:00");
    strictEqual(d(date), "5/13/13");
  });

  it("tomorrow night", function () {
    const date = parse("tomorrow night", mon);
    strictEqual(t(date), "19:00:00");
    strictEqual(d(date), "5/14/13");
  });

  it("tomorrow night at 9", function () {
    const date = parse("tomorrow night at 9", mon);
    strictEqual(t(date), "21:00:00");
    strictEqual(d(date), "5/14/13");
  });

  it("last night", function () {
    const date = parse("last night", mon);
    strictEqual(t(date), "19:00:00");
    strictEqual(d(date), "5/12/13");
  });
});

/**
 * Evening
 */
describe("evening", function () {
  it("evening", function () {
    const date = parse("evening", mon);
    strictEqual(t(date), "17:00:00");
    strictEqual(d(date), "5/13/13");
  });

  it("tomorrow evening", function () {
    const date = parse("tomorrow evening", mon);
    strictEqual(t(date), "17:00:00");
    strictEqual(d(date), "5/14/13");
  });

  it("tomorrow evening at 9", function () {
    const date = parse("tomorrow evening at 9", mon);
    strictEqual(t(date), "21:00:00");
    strictEqual(d(date), "5/14/13");
  });

  it("last evening", function () {
    const date = parse("last evening", mon);
    strictEqual(t(date), "17:00:00");
    strictEqual(d(date), "5/12/13");
  });
});

/**
 * Afternoon
 */
describe("afternoon", function () {
  it("afternoon", function () {
    const date = parse("afternoon", mon);
    strictEqual(t(date), "14:00:00");
    strictEqual(d(date), "5/13/13");
  });

  it("tomorrow afternoon", function () {
    const date = parse("tomorrow afternoon", mon);
    strictEqual(t(date), "14:00:00");
    strictEqual(d(date), "5/14/13");
  });

  it("last afternoon", function () {
    const date = parse("last afternoon", mon);
    strictEqual(t(date), "14:00:00");
    strictEqual(d(date), "5/12/13");
  });
});

/**
 * Morning
 */
describe("morning", function () {
  it("morning", function () {
    const date = parse("morning", mon);
    strictEqual(t(date), "8:00:00");
    strictEqual(d(date), "5/13/13");
  });

  it("tomorrow morning", function () {
    const date = parse("tomorrow morning", mon);
    strictEqual(t(date), "8:00:00");
    strictEqual(d(date), "5/14/13");
  });

  it("last morning", function () {
    const date = parse("last morning", mon);
    strictEqual(t(date), "8:00:00");
    strictEqual(d(date), "5/12/13");
  });

  it("this morning at 9", function () {
    const date = parse("this morning at 9", mon);
    strictEqual(t(date), "9:00:00");
    strictEqual(d(date), "5/13/13");
  });
});

/**
 * Months
 */
describe("months", function () {
  it("this month", function () {
    const date = parse("this month", mon);
    strictEqual(t(date), "1:30:00");
    strictEqual(d(date), "5/13/13");
  });

  it("next month", function () {
    const date = parse("next month", mon);
    strictEqual(t(date), "1:30:00");
    strictEqual(d(date), "6/13/13");
  });

  it("last month", function () {
    const date = parse("last month", mon);
    strictEqual(t(date), "1:30:00");
    strictEqual(d(date), "4/13/13");
  });

  it("2 months from tomorrow", function () {
    const date = parse("2 months from tomorrow", mon);
    strictEqual(t(date), "1:30:00");
    strictEqual(d(date), "7/14/13");
  });

  it("2M from tomorrow", function () {
    const date = parse("2M from tomorrow", mon);
    strictEqual(t(date), "1:30:00");
    strictEqual(d(date), "7/14/13");
  });

  it("2 monthes from tomorrow (misspelling)", function () {
    const date = parse("2 monthes from tomorrow", mon);
    strictEqual(t(date), "1:30:00");
    strictEqual(d(date), "7/14/13");
  });

  it("should handle months with less days", function () {
    const date = parse("1 month", new Date("01/31/2011"));
    strictEqual(d(date), "2/28/11");
  });

  it("should handle leap year", function () {
    const date = parse("1 month", new Date("01/31/2012"));
    strictEqual(d(date), "2/29/12");
  });

  it("tomorrow afternoon at 4:30pm 1 month from now", function () {
    const date = parse("tomorrow afternoon at 4:30pm 1 month from now", mon);
    strictEqual(t(date), "16:30:00");
    strictEqual(d(date), "6/14/13");
  });
});

/**
 * Year
 */
describe("year", function () {
  it("this year", function () {
    const date = parse("year", mon);
    strictEqual(t(date), "1:30:00");
    strictEqual(d(date), "5/13/13");
  });

  it("this yr", function () {
    const date = parse("year", mon);
    strictEqual(t(date), "1:30:00");
    strictEqual(d(date), "5/13/13");
  });

  it("next year", function () {
    const date = parse("next year", mon);
    strictEqual(t(date), "1:30:00");
    strictEqual(d(date), "5/13/14");
  });

  it("last year", function () {
    const date = parse("last year", mon);
    strictEqual(t(date), "1:30:00");
    strictEqual(d(date), "5/13/12");
  });

  it("2 years from yesterday at 5pm", function () {
    const date = parse("2 years from yesterday at 5pm", mon);
    strictEqual(t(date), "17:00:00");
    strictEqual(d(date), "5/12/15");
  });

  it("2 years ago", function () {
    const date = parse("2 years ago", mon);
    strictEqual(t(date), "1:30:00");
    strictEqual(d(date), "5/13/11");
  });

  it("2 years ago--.", function () {
    const date = parse("2 years ago--.", mon);
    strictEqual(t(date), "1:30:00");
    strictEqual(d(date), "5/13/11");
  });

  it("2 years ago tomorrow", function () {
    const date = parse("2 years ago tomorrow", mon);
    strictEqual(t(date), "1:30:00");
    strictEqual(d(date), "5/14/11");
  });
});

/**
 * Dates in the past
 */
describe("dates in the past", function () {
  const past = new Date("May 13, 2013 18:00:00");

  it("tomorrow afternoon", function () {
    const date = parse("tomorrow afternoon", past);
    strictEqual(t(date), "14:00:00");
    strictEqual(d(date), "5/14/13");
  });

  it("tomorrow afternoon at 3pm", function () {
    const date = parse("tomorrow afternoon at 3pm", past);
    strictEqual(t(date), "15:00:00");
    strictEqual(d(date), "5/14/13");
  });

  // Need to place .nextTime() at the end

  it("3pm tomorrow afternoon", function () {
    const date = parse("3pm tomorrow afternoon", past);
    strictEqual(t(date), "15:00:00");
    strictEqual(d(date), "5/14/13");
  });
});

/**
 * Times
 */
describe("times", function () {
  it("1:30", function () {
    const date = parse("1:30", mon);
    strictEqual(t(date), "1:30:00");
    strictEqual(d(date), "5/13/13");
  });

  it("2:31", function () {
    const date = parse("2:31", mon);
    strictEqual(t(date), "2:31:00");
    strictEqual(d(date), "5/13/13");
  });

  it("00:28", function () {
    // past time will result in tomorrow
    const date = parse("00:28", mon);
    strictEqual(t(date), "0:28:00");
    strictEqual(d(date), "5/14/13");
  });
});

/**
 * Ignore other input
 */
describe("other inputs", function () {
  it("invalid", function () {
    const date = parse("invalid", mon);
    strictEqual(d(date), d(mon));
  });

  it("empty", function () {
    const date = parse("", mon);
    strictEqual(d(date), d(mon));
  });
});

/**
 * Bug fixes
 */
describe("bug fixes", function () {
  it("at 12:30pm (fixes: #6)", function () {
    const after = new Date("May 13, 2013 13:30:00");
    const date = parse("at 12:30pm", after);
    strictEqual(t(date), "12:30:00");
    strictEqual(d(date), "5/14/13");
  });

  it("at X in the morning (fixes: #36)", function () {
    const past = new Date("May 13, 2013 18:00:00");
    const date = parse("tomorrow at 9 in the morning", past);
    strictEqual(t(date), "9:00:00");
    strictEqual(d(date), "5/14/13");
  });
});

/**
 * If context is a string parse it as date
 */
describe("parse context if its a string (fixes: #38)", function () {
  it("string context", function () {
    const today = new Date();
    today.setDate(today.getDate() - 1);
    const date = parse("today at 11am", "yesterday at 12:30am");

    strictEqual(d(date), d(today));
    strictEqual(t(date), "11:00:00");
  });
});

/**
 * Support for dates with months
 */
describe("months (fixes: #10)", function () {
  const after = new Date("May 13, 2013 13:30:00");
  it("2nd of January", function () {
    const date = parse("2nd of January 12:30", after);
    strictEqual(t(date), "12:30:00");
    strictEqual(d(date), "1/2/13");
  });

  it("1st of March", function () {
    const date = parse("1st of March", after);
    strictEqual(t(date), "13:30:00");
    strictEqual(d(date), "3/1/13");
  });

  it("1 st of March", function () {
    const date = parse("1 st of March", after);
    strictEqual(t(date), "13:30:00");
    strictEqual(d(date), "3/1/13");
  });

  it("31st of September 4:00am", function () {
    const date = parse("31st of September 4:00am", after);
    strictEqual(t(date), "4:00:00");
    notStrictEqual(d(date), "9/31/13");
    strictEqual(d(date), "10/1/13");
  });

  it("1st of January 4:00am", function () {
    const date = parse("1st of January 4:00am", after);
    strictEqual(t(date), "4:00:00");
    strictEqual(d(date), "1/1/13");
  });

  it("9th of December 4:00am", function () {
    const date = parse("9th of December 4:00am", after);
    strictEqual(t(date), "4:00:00");
    strictEqual(d(date), "12/9/13");
  });
});

/**
 * Suppport 'ago' modifier
 */
describe('support "ago" modifier (fixes: #20)', function () {
  const after = new Date("May 13, 2013 13:30:00");

  it("x seconds ago", function () {
    const date = parse("10 seconds ago", after);
    strictEqual(t(date), "13:29:50");
    strictEqual(d(date), "5/13/13");
  });

  it("x minutes ago", function () {
    const date = parse("5 minutes ago", after);
    strictEqual(t(date), "13:25:00");
    strictEqual(d(date), "5/13/13");
  });

  it("x minute ago", function () {
    const date = parse("1 minutes ago", after);
    strictEqual(t(date), "13:29:00");
    strictEqual(d(date), "5/13/13");
  });

  it("x hours ago", function () {
    const date = parse("5 hours ago", after);
    strictEqual(t(date), "8:30:00");
    strictEqual(d(date), "5/13/13");
  });

  it("x days ago", function () {
    const date = parse("5 day ago", after);
    strictEqual(t(date), "13:30:00");
    strictEqual(d(date), "5/8/13");
  });

  it("x week ago", function () {
    const date = parse("2 week ago", after);
    strictEqual(t(date), "13:30:00");
    strictEqual(d(date), "4/29/13");
  });

  it("x months ago", function () {
    const date = parse("10 months ago", after);
    strictEqual(t(date), "13:30:00");
    strictEqual(d(date), "7/13/12");
  });

  it("x year ago", function () {
    const date = parse("10 year ago", after);
    strictEqual(t(date), "13:30:00");
    strictEqual(d(date), "5/13/03");
  });
});

/**
 * Suppport natural language
 */
describe("support natural language, single-tokens without arithmetics (fixes: #66, 64, 28, 16, 15, 11, 4)", function () {
  it("#66: an hour later", function () {
    const date = parse("an hour later", mon);
    strictEqual(t(date), "2:30:00");
    strictEqual(d(date), "5/13/13");
  });

  it("#64: 2w from wednesday", function () {
    const date = parse("2w from wednesday", mon);
    strictEqual(t(date), "1:30:00");
    strictEqual(d(date), "5/29/13");
  });

  const after = new Date("May 13, 2013 13:30:00");
  it("#28: 2nd day of January", function () {
    const date = parse("2nd day of January 12:30", after);
    strictEqual(t(date), "12:30:00");
    strictEqual(d(date), "1/2/13");
  });

  it("#16: two hours later", function () {
    const date = parse("two hour later", mon);
    strictEqual(t(date), "3:30:00");
    strictEqual(d(date), "5/13/13");
  });

  it("#15: a fortnight from wednesday", function () {
    const date = parse("a fortnight from wednesday", mon);
    strictEqual(t(date), "1:30:00");
    strictEqual(d(date), "5/29/13");
  });

  it("#11: a minute ago", function () {
    const date = parse("a minute ago", after);
    strictEqual(t(date), "13:29:00");
    strictEqual(d(date), "5/13/13");
  });

  it("#4: two hours later", function () {
    const date = parse("two hours later", mon);
    strictEqual(t(date), "3:30:00");
    strictEqual(d(date), "5/13/13");
  });
});

/**
 * Suppport arithmetics
 */
describe("support timeline arithmetics (fixes: #70, 62, 21)", function () {
  // !isn't an elegant fix, utilizes util.removeTnPlus for defaulting
  it("#70: 5 days and 2 hours", function () {
    const date = parse("5 days and 2 hours", mon);
    strictEqual(t(date), "3:30:00");
    strictEqual(d(date), "5/18/13");
  });

  it("#62: 5 days 2 hours", function () {
    const date = parse("5 days 2 hours", mon);
    strictEqual(t(date), "3:30:00");
    strictEqual(d(date), "5/18/13");
  });

  it("#62: 2 hours 30 mins", function () {
    const date = parse("2 hours 30 mins", mon);
    strictEqual(t(date), "4:00:00");
    strictEqual(d(date), "5/13/13");
  });

  // !isn't an elegant fix, utilizes util.removeTnPlus for defaulting
  it("#21: 15 2nd January 12:30", function () {
    const date = parse("on 2nd January 12:30", mon);
    strictEqual(t(date), "12:30:00");
    strictEqual(d(date), "1/2/13");
  });
});

/**
 * Suppport arithmetics
 */
describe("Time extraction from arbitrary sentence", function () {
  it("time extraction: remind me about laundry in 2 hours 30 mins please", function () {
    const date = parse("remind me about laundry in 2 hours 30 mins please", mon);
    strictEqual(t(date), "4:00:00");
    strictEqual(d(date), "5/13/13");
  });

  it("Normal form: May 13, 2011 01:30:00", function () {
    const date = parse("May 13, 2011 01:30:00", mon);
    strictEqual(t(date), "1:30:00");
    strictEqual(d(date), "5/13/11");
  });

  it("Normal form: 13 May 2011 01:30 UTC", function () {
    // not testing the UTC cuz result will differ across timezones
    const date = parse("13 May 2011 01:30", mon);
    strictEqual(t(date), "1:30:00");
    strictEqual(d(date), "5/13/11");
  });
});

/*
 * Today should be able to be in the past
 */
describe("today issue", function () {
  it("test today", () => {
    const date = parse("today at 1am");
    strictEqual(d(date), d(new Date()));
  });
});

/**
 * Time helper function
 */
function t(date: Date): string {
  let t = date.toTimeString().split(" ")[0];
  t = "0" == t[0] ? t.slice(1) : t;
  return t;
}

/**
 * Date helper function
 */
function d(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = "" + date.getFullYear();
  return [month, day, year.slice(2)].join("/");
}
