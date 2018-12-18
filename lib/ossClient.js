const http = require('http')
const OSS = require('ali-oss')
const fs = require('fs')
const path = require('path')
const inquirer = require('inquirer')
const EventEmitter = require('events')
const request = require('./request')
const Kong = require('./kong')
const OSS_TOKEN_URL = 'http://security.dev.quancheng-ec.com/oss/getOssStsToken'

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
  return result
}
class Client extends EventEmitter {
  constructor(prop) {
    super(prop)
    this.ossClient = null
  }
  async getClient(bucket, options) {
    if (this.ossClient && this.ossClient.options.bucket === bucket) return this.ossClient
    let { data } = await request.get(OSS_TOKEN_URL)
    this.ossClient = new OSS({
      region: options ? options.region || 'oss-cn-shanghai' : 'oss-cn-shanghai',
      // region: 'oss-cn-hangzhou',
      accessKeyId: data.AccessKeyId,
      accessKeySecret: data.AccessKeySecret,
      stsToken: data.SecurityToken,
      bucket
    })
    return this.ossClient
  }
  async initBucket(bucket, options) {
    let ossClient = await this.getClient(bucket, options)
    if (!bucket) this.emit('error', '缺少必要参数: bucket')
    const { buckets } = await ossClient.listBuckets({ prefix: bucket })
    if (!buckets) {
      console.log('初始化%s', bucket)
      await ossClient.putBucket(bucket)
      console.log('%s初始化成功, 开始设置权限...', bucket)
      // 设置bucket为可读属性
      await ossClient.putBucketACL(bucket, 'public-read')
      console.log('权限设置成功，开始设置静态网站托管...')
      // 设置静态网站托管
      await ossClient.putBucketWebsite(bucket, {
        index: options.websiteIndex,
        error: options.websiteError
      })
      console.log('静态网站托管设置成功，开始配置Kong...')
      let ossBucketHost = `${bucket}.${ossClient.options.endpoint.host}`
      // 设置kong服务
      let kongRes = await new Kong().init({
        name: bucket,
        host: ossBucketHost
      })
      if (!kongRes.success) this.emit('error', kongRes.error)
    }
  }
  async fetchBucket(bucket, options) {
    try {
      let ossClient = await this.getClient(bucket, options)
      let list = await ossClient.listBuckets()
      return list
    } catch (error) {
      this.emit('error', error)
    }
  }
  async deleteBucket(bucket, options) {
    try {
      let ossClient = await this.getClient(bucket, options)
      return await ossClient.deleteBucket(bucket)
    } catch (error) {
      this.emit('error', error)
    }
  }
  async fetchFiles(bucket, options) {
    try {
      let ossClient = await this.getClient(bucket, options)
      let { objects } = await ossClient.list()
      return objects
    } catch (error) {
      this.emit('error', error)
    }
  }
  async clearFile(bucket, options) {
    try {
      let { file, dir, all } = options
      if (!file && !dir && !all) return console.log('删除文件错误：请指定要删除的文件或目录')
      let ossClient = await this.getClient(bucket, options)

      // 查询文件
      let { objects } = await ossClient.list({ prefix: all ? '' : dir || file })
      if (!objects || !objects.length) return console.log('没有找到指定的文件')
      let files = objects.map(f => f.name)
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
  async uploadFiles(bucket, options) {
    try {
      let { tag, localFilePath, uploadFilePath } = options
      // 初始化client
      let ossClient = await this.getClient(bucket, options)
      // 获取文件路径
      let localFiles = findFilesByPath(localFilePath)
      if (!localFiles || !localFiles.length) return this.emit('error', `${localFilePath}目录不存在`)
      // 初始化bucket
      await this.initBucket(bucket, options)
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
