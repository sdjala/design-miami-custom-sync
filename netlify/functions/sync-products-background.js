import {handle} from './handleRequest'

/**
 * Sanity Connect sends POST requests and expects both:
 * - a 200 status code
 * - a response header with `content-type: application/json`
 * 
 * Remember that this may be run in batches when manually syncing.
 */
export const handler = async (req, res) => {
  // Next.js will automatically parse `req.body` with requests of `content-type: application/json`,
  // so manually parsing with `JSON.parse` is unnecessary.
  const { body, httpMethod } = req;
  const parsedData = JSON.parse(body)
  // Ignore non-POST requests
  if (httpMethod !== "POST") {
    return {statusCode: 405, body: "Method not allowed" };
  }

  await handle(parsedData)

  return {statusCode: 200, body: JSON.stringify({
			message: 'This is what will be returned!'
		}) };
}