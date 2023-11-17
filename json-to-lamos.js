import { stableStringify } from './index.js'

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
      data = JSON.parse(Buffer.concat(chunks))
    } catch (error) {
      console.error(error.message)
      process.exit(1)
      throw error
    }
    process.stdout.write(stableStringify(data))
    process.stdout.write('\n')
  })
