import type { ClientRequest } from 'node:http'
import type { RequestOptions } from 'node:https'
import http from 'node:https'

export default function httpRequest<T>(options: RequestOptions, data?: any): Promise<T> {
  let result = ''
  const promise = new Promise<T>((resolve, reject) => {
    const req: ClientRequest = http
      .request(options, (res) => {
        res.on('data', (chunk) => {
          result += chunk
        })
        res.on('error', reject)

        res.on('end', () => {
          try {
            let body = result
            //there are empty responses

            if (res.statusCode === 200) {
              body = JSON.parse(result)
            }

            resolve(body as T)
          } catch (err) {
            reject(err)
          }
        })
      })
      .end()

    req.on('error', reject)
    req.on('timeout', reject)
    req.on('uncaughtException', reject)

    if (data) {
      const body = JSON.stringify(data)
      req.write(body)
    }
  })

  return promise
}
