var request = require('request')
const codes = [200, 201, 204]
const RESPONSE = (resolve, reject) => (error, response, body) => {
  // console.log(error, response.statusCode, body)
  let result = {
    error,
    code: response.statusCode,
    data: body,
    url: response.request.href
  }
  if (codes.includes(result.code)) {
    try {
      result.data = JSON.parse(body)
    } catch (error) {}
    resolve(result)
  } else {
    reject(result)
  }
}
const get = async url => new Promise((resolve, reject) => request(url, RESPONSE(resolve, reject)))
const post = async (url, data) =>
  new Promise((resolve, reject) =>
    request(
      {
        url,
        method: 'POST',
        json: true,
        headers: { 'content-type': 'application/json' },
        body: data
      },
      RESPONSE(resolve, reject)
    )
  )

module.exports = { get, post }
