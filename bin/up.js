#!/usr/bin/env node

var program = require('commander')
var packInfo = require('../package.json')
const Client = require('../lib/ossClient')

program.version(packInfo.version)

program
  .command('upload <bucket>')
  .alias('up')
  .description('上传文件到oss')
  .option('-t, --tag [tag]', '上传目录添加tag')
  .option('-l, --local-file-path [localFilePath]', '指定上传的文件本地路径', 'build')
  .option('-u, --upload-file-path [uploadFilePath]', '指定上传到服务器的文件路径', 'build')
  .action(function(bucket, option) {
    const client = new Client(bucket)
    client.on('error', function(error) {
      console.error(error)
      process.exit(1)
    })
    client.uploadFiles(bucket, option)
  })

program
  .command('fetch <bucket>')
  .alias('f')
  .option('-p, --prefix [prefix]', '指定只列出符合特定前缀的文件')
  .option('-m, --marker [marker]', '指定只列出文件名大于marker之后的文件')
  .option('-mk, --max-keys [maxKeys]', '用于指定最多返回的文件个数')
  .description('查询bucket下的文件')
  .action(Client.fetchFiles)

program
  .command('clear <bucket>')
  .alias('c')
  .option('-f, --file [file]', '删除指定目录的文件')
  .option('-d, --dir [dir]', '删除文件目录下所有文件')
  .option('-a, --all', '删除全部文件', false)
  .description('删除bucket下的文件')
  .action(Client.clearFile)

program.parse(process.argv)
