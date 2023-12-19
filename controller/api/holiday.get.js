import { resolve } from "path";
import { readFileSync } from "fs";

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export default async function RequestHandler(req, res) {
  const { year, lang } = req.query;

  if (!res.locals.holidayData) res.locals.holidayData = {};
  if (!res.locals.holidayData[year]) {
    const data = readFileSync(
      resolve(`assets/holidays-${year}-${lang.toUpperCase()}.json`),
      "utf-8"
    );

    res.locals.holidayData[year] = JSON.parse(data);
    res.locals.holidayData[year].forEach((holiday) => {
      holiday.date = new Date(holiday.date);
    });
  }

  return res.json(res.locals.holidayData[year] ?? []);
}
