[![npm version](https://badge.fury.io/js/@lesjoursfr%2Fdate.svg)](https://badge.fury.io/js/@lesjoursfr%2Fdate)
[![QC Checks](https://github.com/lesjoursfr/date/actions/workflows/quality-control.yml/badge.svg)](https://github.com/lesjoursfr/date/actions/workflows/quality-control.yml)

# @lesjoursfr/date

Date is an english language date parser for Node.js and the browser.

**This is a fork of [@matthewmueller project date.js](https://github.com/matthewmueller/date)**

## Installation

### On the server or in the browser:

```bash
npm install @lesjoursfr/date
```

## Examples

```js
date("10 minutes from now");
date("in 5 hours");
date("at 5pm");
date("at 12:30");
date("at 23:35");
date("in 2 days");
date("tuesday at 9am");
date("monday at 1:00am");
date("last monday at 1:00am");
date("tomorrow at 3pm");
date("yesterday at 12:30am");
date("5pm tonight");
date("tomorrow at noon");
date("next week tuesday");
date("next week tuesday at 4:30pm");
date("2 weeks from wednesday");
date("tomorrow night at 9");
date("tomorrow afternoon");
date("this morning at 9");
date("at 12:30pm");
date("tomorrow at 9 in the morning");
date("2 years from yesterday at 5pm");
date("last month");
date("2nd of January");
date("1st of March");
date("1 st of March");
date("31st of September 4:00am");
date("1st of January 4:00am");
date("9th of December 4:00am");
date("tomorrow afternoon at 4:30pm 1 month from now");
date("10 seconds ago");
date("1 minute ago");
date("2 hours ago");
date("5 weeks ago");
date("2 months ago");
date("1 year ago");
date("an hour later");
date("2w from wednesday");
date("2nd day of January");
date("two hours later");
date("a fortnight from wednesday");
date("a minute ago");
date("at 12:30");
date("at 12.30");
date("tuesday at 9");
date("tomorrow at 15");
```

## API

### date(str, [offset])

Create a `Date` from a `str`. You may also supply an optional `offset` to the starting date. `offset` defaults to the current date and time.

## Tests

To run the tests, you'll need Node.js:

```bash
npm install
npm run test
```
