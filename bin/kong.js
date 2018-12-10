#!/usr/bin/env node

var program = require('commander')
var packInfo = require('../package.json')
const Kong = require('../lib/kong')
const ERROR_FN = error => {
  console.error(error)
  process.exit(1)
}
program.version(packInfo.version)

program
  .command('init <name>  <host>')
  .alias('i')
  .description('初始化服务')
  .option('-l, --protocol [protocol]', '协议,http（默认）或https', 'http')
  .option('-p, --port [port]', '端口。默认为80', 80)
  .option('-P, --path [path]', '求中使用的路径。默认为空')
  .option('-r, --retries [retries]', '代理失败时要执行的重试次数。默认是5', 5)
  .option('-c, --connect_timeout [connect_timeout]', '建立连接的超时时间（以毫秒为单位）。默认为60000', 60000)
  .option(
    '-w, --write_timeout [write_timeout]',
    '发送请求的两次连续写操作之间的超时（以毫秒为单位）。默认为60000',
    60000
  )
  .option(
    '-n, --read_timeout [read_timeout]',
    '发送请求的两次连续读取操作之间的超时（以毫秒为单位）。默认为60000',
    60000
  )
  .action(async function(name, host, options) {
    let kong = new Kong()
    let { protocol, port, path, retries, connect_timeout, write_timeout, read_timeout } = options
    await kong.initService({
      name,
      host,
      protocol,
      port,
      path,
      retries,
      connect_timeout,
      write_timeout,
      read_timeout
    })
  })

program.parse(process.argv)
