const http = require('http')
const OSS = require('ali-oss')
const fs = require('fs')
const path = require('path')
const inquirer = require('inquirer')
const EventEmitter = require('events')
const OSS_TOKEN_URL = 'http://security.dev.quancheng-ec.com/oss/getOssStsToken'

const HTTP_GET = async url =>
  new Promise((resolve, reject) => {
    http.get(url, function(data) {
      var resData = ''
      data.on('data', chunk => (resData += chunk))
      data.on('end', () => resolve(resData))
    })
  })

/**
 * 获取指定目录下的所有文件路径+文件名
 * @param {*} directory
 */
const findFilesByPath = directory => {
  let result = []
  function finder(filePath) {
    let files = fs.readdirSync(filePath)
    files.forEach((val, index) => {
      let file = path.join(filePath, val)
      let stats = fs.statSync(file)
      if (stats.isDirectory()) finder(file)
      if (stats.isFile()) result.push(file)
    })
  }
  finder(directory)
  console.log(result)

  return result
}
class Client extends EventEmitter {
  constructor(prop) {
    super(prop)
    this.ossClient = null
  }
  async getClient(bucket) {
    if (this.ossClient && this.ossClient.options.bucket === bucket) return this.ossClient
    let result = JSON.parse(await HTTP_GET(OSS_TOKEN_URL))
    this.ossClient = new OSS({
      region: 'oss-cn-hangzhou',
      accessKeyId: result.AccessKeyId,
      accessKeySecret: result.AccessKeySecret,
      stsToken: result.SecurityToken,
      bucket
    })
    return this.ossClient
  }
  async initBucket(bucket, client) {
    let _this = this
    let ossClient = client || this.ossClient
    if (!bucket) _this.emit('error', '缺少必要参数: bucket')
    const { buckets } = await ossClient.listBuckets({ prefix: bucket })
    if (!buckets) {
      console.log('初始化%s', bucket)
      await ossClient
        .putBucket(bucket)
        .then(
          res => console.log('%s初始化成功', bucket),
          err => _this.emit('error', `bucket初始化失败:${err}`)
        )
    }
  }
  async fetchBucket(bucket) {
    try {
      let ossClient = await this.getClient(bucket)
      return await ossClient.listBuckets()
    } catch (error) {
      this.emit('error', error)
    }
  }
  async deleteBucket(bucket) {
    try {
      let ossClient = await this.getClient(bucket)
      return await ossClient.deleteBucket(bucket)
    } catch (error) {
      this.emit('error', error)
    }
  }
  async fetchFiles(bucket, option) {
    try {
      let ossClient = await this.getClient(bucket)
      let { objects } = await ossClient.list()
      return objects
    } catch (error) {
      this.emit('error', error)
    }
  }
  async clearFile(bucket, option) {
    try {
      let { file, dir, all } = option
      if (!file && !dir && !all) return console.log('删除文件错误：请指定要删除的文件或目录')
      // 查询文件
      let files = await findBucketFiles({ prefix: all ? '' : dir || file })
      if (!files.length) return console.log('没有找到指定的文件')
      console.log(files)
      let confirm = (await inquirer.prompt([
        {
          type: 'input',
          name: 'confirm',
          message: '是否确认删除以上文件(y/n)：'
        }
      ])).confirm
      if (confirm === 'y') {
        await ossClient.deleteMulti(files)
        console.log('-----  删除文件成功 -----')
      }
    } catch (error) {
      this.emit('error', error)
    }
  }
  async uploadFiles(bucket, option) {
    try {
      let { tag, localFilePath, uploadFilePath } = option
      // 初始化client
      let ossClient = await this.getClient(bucket)
      // 获取文件路径
      let localFiles = findFilesByPath(localFilePath)
      if (!localFiles || !localFiles.length) return this.emit('error', `${localFilePath}目录不存在`)
      // 初始化bucket
      await this.initBucket(bucket)
      // 上传文件
      await localFiles.forEach(async (lf, i) => {
        let uploadDir = path.join(tag || '', uploadFilePath || '', lf.replace(localFilePath, ''))
        console.log('正在上传 %s  =>   %s', lf, uploadDir)
        await ossClient.put(uploadDir, lf)
      })
      console.log(`-----  上传成功  -----`)
    } catch (error) {
      this.emit('error', error)
    }
  }
}
module.exports = Client
