import axios from 'axios'
import { Message, MessageBox } from 'element-ui'
import store from '../store'
import { getToken } from '@/utils/auth'
var sha1 = require('@/utils/sha1.js');


// 创建axios实例
const service = axios.create({
  baseURL: process.env.BASE_API, // api的base_url
  timeout: 5000, // 请求超时时间
})

// request拦截器
service.interceptors.request.use(
  config => {
     // config.headers['Access-Control-Allow-Origin']='*';
     // config.headers['Access-Control-Allow-Methods']='POST, GET, OPTIONS, PUT, DELETE';
     // config.headers['Access-Control-Allow-Headers']='Content-Type, X-Auth-Token, Origin, Authorization';
    var timestamp = Date.parse(new Date());
    var timestamp = timestamp / 1000;
    var key=store.getters.key;
    var s= sha1.hex_sha1(key + timestamp);
    config.params.t=timestamp;
    config.params.s=s;

    if (store.getters.token) {
        config.params.token = getToken() // 让每个请求携带自定义token 请根据实际情况自行修改
    }

    return config
  },
  error => {
    // Do something with request error
    console.log(error) // for debug
    Promise.reject(error)
  }
)

// respone拦截器
service.interceptors.response.use(
  response => {
    /**
     * success为非20000是抛错 可结合自己业务进行修改
     */
    const res = response.data;
    console.log(res);
    console.log(res.success);
        if (res.success !== 0) {
      Message({
        message: res.message,
        type: 'error',
        duration: 5 * 1000
      })

      // 50008:非法的token; 50012:其他客户端登录了;  50014:Token 过期了;
      if (res.success <3) {
        MessageBox.confirm(
          '你已被登出，可以取消继续留在该页面，或者重新登录',
          '确定登出',
          {
            confirmButtonText: '重新登录',
            cancelButtonText: '取消',
            type: 'warning'
          }
        ).then(() => {
          store.dispatch('FedLogOut').then(() => {
            location.reload() // 为了重新实例化vue-router对象 避免bug
          })
        })
      }else if(res.success==4){
        MessageBox.confirm(
          '确定登出',
          {
            confirmButtonText: '重新登录',
            cancelButtonText: '取消',
            type: 'warning'
          }
        ).then(() => {
          
          store.dispatch('FedLogOut').then(() => {
            location.reload() // 为了重新实例化vue-router对象 避免bug
          })
        })
      }
      return Promise.reject('error')
    } 
    else {
      return response
    }

  },
  error => {
    console.log('err' + error) // for debug
    Message({
      message: error.message,
      type: 'error',
      duration: 5 * 1000
    })
    return Promise.reject(error)
  }
)

export default service
