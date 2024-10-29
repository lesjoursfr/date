/**
 * Time constants
 */
const _second = 1000;
const _minute = 60 * _second;
const _hour = 60 * _minute;
const _day = 24 * _hour;
const _week = 7 * _day;
const _daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/**
 * Check if the year is a leap year.
 *
 * @param {Number} yr
 * @return {Boolean}
 */
function leapyear(yr: number): boolean {
  return (yr % 4 === 0 && yr % 100 !== 0) || yr % 400 === 0;
}

type ParserDateChanged = {
  seconds?: boolean;
  minutes?: boolean;
  hours?: boolean;
  days?: boolean;
  weeks?: boolean;
  years?: boolean;
};
type ParserDateChangedKey = keyof ParserDateChanged;

/**
 * ParserDate class
 */
export default class ParserDate {
  private _changed: ParserDateChanged;
  public date: Date;

  /**
   * Initialize `date`
   *
   * @param {Date} offset (optional)
   * @return {Date}
   * @api publics
   */

  public constructor(offset: Date) {
    this._changed = {};
    this.date = new Date(offset);
  }

  /**
   * Clone the current date
   */

  public clone() {
    return new Date(this.date);
  }

  /**
   * Has changed
   *
   * @param {String} str
   * @return {Boolean}
   */
  public changed(str: ParserDateChangedKey): boolean {
    if (this._changed[str] === undefined) {
      return false;
    }
    return this._changed[str];
  }

  /**
   * add or subtract seconds
   *
   * @param {Number} n
   * @return {ParserDate}
   */
  public second(n: number): ParserDate {
    const seconds = +n * _second;
    this.update(seconds);
    this._changed.seconds = true;
    return this;
  }

  /**
   * add or subtract minutes
   *
   * @param {Number} n
   * @return {ParserDate}
   */
  public minute(n: number): ParserDate {
    const minutes = +n * _minute;
    this.update(minutes);
    this._changed.minutes = true;
    return this;
  }

  /**
   * add or subtract hours
   *
   * @param {Number} n
   * @return {ParserDate}
   */
  public hour(n: number): ParserDate {
    const hours = +n * _hour;
    this.update(hours);
    this._changed.hours = true;
    return this;
  }

  /**
   * add or subtract days
   *
   * @param {Number} n
   * @return {ParserDate}
   */
  public day(n: number): ParserDate {
    const days = +n * _day;
    this.update(days);
    this._changed.days = true;
    return this;
  }

  /**
   * add or subtract weeks
   *
   * @param {Number} n
   * @return {ParserDate}
   */
  public week(n: number): ParserDate {
    const weeks = +n * _week;
    this.update(weeks);
    this._changed.weeks = true;
    return this;
  }

  /**
   * add or subtract months
   *
   * @param {Number} n
   * @return {ParserDate}
   */
  public month(n: number): ParserDate {
    const d = this.date;
    const day = d.getDate();
    d.setDate(1);
    const month = +n + d.getMonth();
    d.setMonth(month);

    // Handle dates with less days
    const dim = this.daysInMonth(month);
    d.setDate(Math.min(dim, day));
    return this;
  }

  /**
   * get the days in the month
   */
  public daysInMonth(m: number): number {
    const dim = _daysInMonth[m];
    const leap = leapyear(this.date.getFullYear());
    return 1 == m && leap ? 29 : dim;
  }

  /**
   * add or subtract years
   *
   * @param {Number} n
   * @return {ParserDate}
   */
  public year(n: number): ParserDate {
    let yr = this.date.getFullYear();
    yr += +n;
    this.date.setFullYear(yr);
    this._changed.years = true;
    return this;
  }

  /**
   * Set the time
   *
   * @param {Number | false} h
   * @param {Number | false} m
   * @param {Number | false} s
   * @param {String | undefined} meridiem
   * @return {ParserDate}
   */
  public time(h: number | false, m: number | false, s: number | false, _meridiem?: string): ParserDate {
    if (h === false) {
      h = this.date.getHours();
    } else {
      h = +h || 0;
      this._changed.hours = true;
    }

    if (m === false) {
      m = this.date.getMinutes();
    } else {
      m = +m || 0;
      this._changed.minutes = true;
    }

    if (s === false) {
      s = this.date.getSeconds();
    } else {
      s = +s || 0;
      this._changed.seconds = true;
    }

    this.date.setHours(h, m, s);
    return this;
  }

  /**
   * Day functions
   */
  public sunday(n: number): ParserDate {
    this._changed["days"] = true;
    this.updateDay(0, n);
    return this;
  }
  public monday(n: number): ParserDate {
    this._changed["days"] = true;
    this.updateDay(1, n);
    return this;
  }
  public tuesday(n: number): ParserDate {
    this._changed["days"] = true;
    this.updateDay(2, n);
    return this;
  }
  public wednesday(n: number): ParserDate {
    this._changed["days"] = true;
    this.updateDay(3, n);
    return this;
  }
  public thursday(n: number): ParserDate {
    this._changed["days"] = true;
    this.updateDay(4, n);
    return this;
  }
  public friday(n: number): ParserDate {
    this._changed["days"] = true;
    this.updateDay(5, n);
    return this;
  }
  public saturday(n: number): ParserDate {
    this._changed["days"] = true;
    this.updateDay(6, n);
    return this;
  }

  /**
   * go to day of week
   *
   * @param {Number} day
   * @param {Number} n
   * @return {ParserDate}
   */
  public updateDay(d: number, n: number): ParserDate {
    n = +(n || 1);
    let diff = (d - this.date.getDay() + 7) % 7;
    if (n > 0) --n;
    diff += 7 * n;
    this.update(diff * _day);
    return this;
  }

  /**
   * Update the date
   *
   * @param {Number} ms
   * @return {ParserDate}
   * @api private
   */
  public update(ms: number): ParserDate {
    this.date = new Date(this.date.getTime() + ms);
    return this;
  }
}
