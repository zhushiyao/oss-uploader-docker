const http = require('http')
const OSS = require('ali-oss')
const fs = require('fs')
const path = require('path')
const inquirer = require('inquirer')
const OSS_TOKEN_URL = 'http://security.dev.quancheng-ec.com/oss/getOssStsToken'

let ossClient = null

const getOSSClient = bucket => {
  if (ossClient && ossClient.options.bucket === bucket) return Promise.resolve(ossClient)
  return initOssClient(bucket)
}

const initOssClient = bucket =>
  new Promise((resolve, reject) => {
    console.log('`-----  初始化ossClient -----`')

    http.get(OSS_TOKEN_URL, function(data) {
      var resData = ''
      data.on('data', function(chunk) {
        resData += chunk //监听数据响应，拼接数据片段
      })
      data.on('end', function() {
        try {
          let result = JSON.parse(resData)
          ossClient = new OSS({
            region: 'oss-cn-hangzhou',
            accessKeyId: result.AccessKeyId,
            accessKeySecret: result.AccessKeySecret,
            stsToken: result.SecurityToken,
            bucket
          })
          resolve(ossClient)
        } catch (error) {
          throw new Error(`初始化ossClient失败:${err}`)
        }
      })
    })
  })

/**
 * 上传文件
 */
const ossUploadFile = async (localFile, uploadFile) => {
  console.log(`-----  开始上传文件 ${localFile}=>${uploadFile} -----`)
  try {
    await ossClient.put(uploadFile, localFile)
  } catch (error) {
    throw new Error(`上传文件失败:${error}`)
  }
}

/**
 * 查询并初始化bucket
 */
const initBucket = async bucket => {
  if (!bucket) throw new Error(`bucket初始化失败: bucket必填`)
  const result = await ossClient.listBuckets({
    prefix: bucket
  })
  let { buckets } = result
  // 判断bucket是否存在，不存在则创建bucket
  if (buckets) {
    // console.log(`%s已存在，无需初始化`, bucket)
  } else {
    console.log('%s不存在，开始初始化', bucket)
    await ossClient.putBucket(bucket).then(
      res => {
        console.log('%s初始化成功', bucket)
      },
      err => {
        throw new Error(`bucket初始化失败:${err}`)
      }
    )
  }
}
/**
 * 查询bucket下的文件
 */
const findBucketFiles = async (params, print) => {
  let files = []
  let result = null
  try {
    result = await ossClient.list(params)
  } catch (error) {
    throw new Error(`查询文件错误: 命名空间${ossClient.options.bucket}不存在`)
  }
  result.objects &&
    result.objects.forEach(function(obj) {
      if (print) console.log('file: %s', obj.name)
      files.push(obj.name)
    })
  return files
}

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

/**
 * 上传文件到bucket
 * @param {*} bucket
 * @param {*} option
 */
const uploadFiles = async (bucket, option) => {
  try {
    let { tag, localFilePath, uploadFilePath } = option

    // 初始化client
    if (!(await getOSSClient(bucket))) return
    // 获取路径下所有文件
    let localFiles = findFilesByPath(localFilePath)
    // 初始化bucket
    await initBucket(bucket)
    if (!localFiles || !localFiles.length) return console.log('%s目录下有没文件', localFilePath)
    // 上传文件
    await localFiles.forEach(async (lf, i) => {
      let uploadDir = path.join(tag || '', uploadFilePath || '', lf.replace(localFilePath, ''))
      await ossUploadFile(lf, uploadDir)
    })
    console.log(`-----  上传成功  -----`)

    // 查询bucket下的文件
    // let bucketFiles = await Client.findBucketFiles()
  } catch (error) {
    console.error('uploadFiles error: %s', error)
  }
}

/**
 * 提供给外部的查询文件接口
 * @param {*} bucket
 * @param {*} option
 */
const fetchFiles = async (bucket, option) => {
  try {
    if (!(await getOSSClient(bucket))) return
    let files = await findBucketFiles({
      prefix: option.prefix,
      marker: option.marker,
      delimiter: option.delimiter,
      maxKeys: option.maxKeys
    })
    console.log('查询到文件', files)
  } catch (error) {
    console.error(error)
  }
}
/**
 * 删除文件
 * @param {*} bucket
 * @param {*} option
 */
const clearFile = async (bucket, option) => {
  try {
    if (!(await getOSSClient(bucket))) return
    let { file, dir, all } = option
    if (!file && !dir && !all) return console.log('删除文件错误：请指定要删除的文件或目录')
    // 查询文件
    let files = await findBucketFiles({
      prefix: all ? '' : dir || file
    })
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
    console.error(error)
  }
}

module.exports = {
  fetchFiles,
  uploadFiles,
  clearFile
}
