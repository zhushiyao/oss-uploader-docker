const Client = require('./lib/ossClient')
// const bucket = 'web-template-test'
const bucket = 'test-jenkin1s'
let client = new Client()

// console.log('new :', oss)
client.on('error', function(error) {
  console.log(error)
})
// client.fetchBucket().then(res => console.log(res))
// client.fetchFiles(bucket).then(files => console.log(res))
;(async () => {
  try {
    let ossClient = await client.getClient(bucket)
    console.log(await ossClient.list())
  } catch (error) {
    console.log(error)
  }
})()
