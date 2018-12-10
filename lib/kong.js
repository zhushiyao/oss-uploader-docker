const request = require('./request')
const EventEmitter = require('events')
const URL = 'http://10.42.253.222:8001'
const SERVICE_HOST = '.daily.quancheng-ec.com'
const PLUGINS_RESPONSE = {
  name: 'response-transformer',
  config: {
    remove: {
      headers: ['Content-Disposition']
    }
  },
  enabled: true
}
const DEFAULT_CONFIG = {
  name: '',
  host: '',
  protocol: 'http',
  port: 80,
  path: '',
  retries: 5,
  connect_timeout: 60000,
  write_timeout: 60000,
  read_timeout: 60000
}

class Kong {
  async init(params) {
    let response = {
      success: true,
      error: null,
      router: `${params.name}${SERVICE_HOST}`
    }
    try {
      let r = await request.get(`${URL}/services/${params.name}`)
      console.log('%s服务已存在,无需初始化', params.name)
    } catch (error) {
      if (error.code === 404) {
        try {
          console.log('%s服务不存在,开始创建服务', params.name)
          let createService = await request.post(
            `${URL}/services/`,
            Object.assign({}, DEFAULT_CONFIG, params)
          )
          let serviceId = createService.data.id
          console.log('服务创建成功，开始创建路由....')
          let routes = await request.post(`${URL}/routes/`, {
            hosts: [`${params.name}${SERVICE_HOST}`],
            service: { id: serviceId }
          })
          console.log('路由创建成功，开始配置插件....')
          let plugins = await request.post(
            `${URL}/plugins/`,
            Object.assign(
              {
                service_id: serviceId
              },
              PLUGINS_RESPONSE
            )
          )
          console.log('配置插件成功....')
        } catch (error) {
          response.error = error
        }
      } else {
        response.error = error
      }
    }
    return response
  }
}

module.exports = Kong
