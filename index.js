const Client = require('./lib/ossClient')
// const bucket = 'web-template-test'
// const bucket = 'offlineteam-crm'
const bucket = 'react-template-web'
// const bucket = 'offlineteam-crm-oss'
// const bucket = 'zsy-test'

// // console.log('new :', oss)
// client.on('error', function(error) {
//   console.log(error)
// })
//
// // client.fetchFiles(bucket).then(files => console.log(res))
;(async () => {
  try {
    let client = new Client()

    // ======    查询bucket
    // client.fetchBucket().then(res => {
    //   // console.log(res)
    //   res.buckets.map(b => console.log(b.name))
    // })

    // ======  查询文件
    // let objects = await client.fetchFiles(bucket)
    // console.log(objects)

    // console.log(objects.map(f => f.name))

    // ======   清除bucket
    // await client.clearFile(bucket, { all: true })
    // await client.deleteBucket(bucket, { all: true })

    // ====== 查询权限
    // let ossClient = await client.getClient(bucket)
    // let result = await ossClient.getBucketACL(bucket)
    // let result = await ossClient.getACL('index.html')
    // console.log(result)

    // ======  查看托管页面
    // let ossClient = await client.getClient(bucket)
    // let result = await ossClient.getBucketWebsite(bucket)
    // console.log(result)

    // ======
  } catch (error) {
    console.log(error)
  }
})()

var request = require('./lib/request')
request.get('http://10.42.253.222:8001/services/react-template-web').then(res => console.log(res))
