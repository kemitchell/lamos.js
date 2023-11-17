#!/usr/bin/env node
import { parse } from 'lamos'

const chunks = []
process.stdin
  .on('data', chunk => { chunks.push(chunk) })
  .once('error', error => {
    console.error(error.message)
    process.exit(1)
  })
  .once('end', () => {
    let data
    try {
      data = parse(Buffer.concat(chunks).toString('utf8'))
    } catch (error) {
      console.error(error.message)
      process.exit(1)
      throw error
    }
    process.stdout.write(JSON.stringify(data))
    process.stdout.write('\n')
  })
