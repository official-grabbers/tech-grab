#!/usr/bin/env node

const Wappalyzer = require('./driver')

const aliases = {
  a: 'userAgent',
  b: 'batchSize',
  d: 'debug',
  t: 'delay',
  h: 'help',
  H: 'header',
  D: 'maxDepth',
  m: 'maxUrls',
  p: 'probe',
  P: 'pretty',
  r: 'recursive',
  w: 'maxWait',
  n: 'noScripts',
  N: 'noRedirect',
  e: 'extended',
}

function parseArguments(args, aliases) {
  const options = {}
  let url

  const matches = /^-?-([^=]+)(?:=(.+)?)?/.exec(args)
  if (matches) {
    const key =
      aliases[matches[1]] ||
      matches[1].replace(/-\w/g, (_matches) => _matches[1].toUpperCase())
    const value = matches[2]
      ? matches[2]
      : args[0] && !args[0].startsWith('-')
      ? args.shift()
      : true

    if (options[key]) {
      if (!Array.isArray(options[key])) {
        options[key] = [options[key]]
      }

      options[key].push(value)
    } else {
      options[key] = value
    }
  } else {
    url = args
  }

  return { url, options }
}

function validateUrl(url) {
  try {
    const { hostname } = new URL(url)

    if (!hostname) {
      throw new Error('Invalid URL')
    }
  } catch (error) {
    throw new Error(error)
  }
}

function parseHeadersAndStorage(options) {
  const headers = {}
  const storage = {
    local: {},
    session: {},
  }

  if (options.header) {
    ;(Array.isArray(options.header)
      ? options.header
      : [options.header]
    ).forEach((header) => {
      const [key, value] = header.split(':')

      headers[key.trim()] = (value || '').trim()
    })
  }

  for (const type of Object.keys(storage)) {
    if (options[`${type}Storage`]) {
      try {
        storage[type] = JSON.parse(options[`${type}Storage`])

        if (
          !options[`${type}Storage`] ||
          !Object.keys(options[`${type}Storage`]).length
        ) {
          throw new Error('Object has no properties')
        }
      } catch (error) {
        throw new Error(error)
      }
    }
  }

  return { headers, storage }
}

async function runWappalyzer(websiteURL) {
  const { url: parsedUrl, options } = parseArguments(websiteURL, aliases)
  validateUrl(parsedUrl)

  const { headers, storage } = parseHeadersAndStorage(options)

  const wappalyzer = new Wappalyzer(options)

  try {
    await wappalyzer.init()

    const site = await wappalyzer.open(parsedUrl, headers, storage)

    await new Promise((resolve) =>
      setTimeout(resolve, parseInt(options.defer || 0, 10))
    )

    const results = await site.analyze()

    await wappalyzer.destroy()

    return results
  } catch (error) {
    try {
      await Promise.race([
        wappalyzer.destroy(),
        new Promise((resolve, reject) =>
          setTimeout(
            () => reject(new Error('Attempt to close the browser timed out')),
            3000
          )
        ),
      ])
    } catch (error) {
      throw new Error(error)
    }

    throw error
  }
}

module.exports = runWappalyzer
