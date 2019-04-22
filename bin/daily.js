#!/usr/bin/env node

var program = require('commander')
var packInfo = require('../package.json')
const Client = require('../lib/ossClient')
const ERROR_FN = error => {
  console.error(error)
  process.exit(1)
}
program.version(packInfo.version)

program
  .command('upload <bucket>')
  .alias('up')
  .description('上传文件到oss')
  .option('-r, --region [region]', 'oss region', 'oss-cn-shanghai')
  .option('-t, --tag [tag]', '上传目录添加tag', '')
  .option('-d, --local-file-directory [localFileDirectory]', '指定上传的文件夹路径', '')
  .option('-f, --local-file [localFile]', '指定上传的文件路径', '')
  .option('-u, --upload-file-path [uploadFilePath]', '指定上传到服务器的文件路径', '')
  .option('-i, --website-index [websiteIndex]', '指定托管页面index地址', 'index.html')
  .option('-e, --website-error [websiteError]', '指定托管页面error地址', 'index.html')
  .action(async function(bucket, options) {
    const client = new Client(bucket)
    client.on('error', ERROR_FN)
    try {
      await client.uploadFiles(bucket, options)
    } catch (error) {
      ERROR_FN(error)
    }
  })

program
  .command('fetch <bucket>')
  .alias('f')
  .option('-p, --prefix [prefix]', '指定只列出符合特定前缀的文件')
  .option('-m, --marker [marker]', '指定只列出文件名大于marker之后的文件')
  .option('-mk, --max-keys [maxKeys]', '用于指定最多返回的文件个数')
  .description('查询bucket下的文件')
  .action(async function(bucket, options) {
    const client = new Client(bucket)
    client.on('error', ERROR_FN)
    console.log(await client.fetchFiles(bucket, options))
  })

program
  .command('clear <bucket>')
  .alias('c')
  .option('-f, --file [file]', '删除指定目录的文件')
  .option('-d, --dir [dir]', '删除文件目录下所有文件')
  .option('-a, --all', '删除全部文件', false)
  .description('删除bucket下的文件')
  .action(function(bucket, options) {
    const client = new Client(bucket)
    client.on('error', ERROR_FN)
    client.clearFile(bucket, options)
  })

program.parse(process.argv)
