/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export default function RequestHandler(req, res) {
  const version = res.locals.version;
  return res.json({ version: `v${version}` });
}
