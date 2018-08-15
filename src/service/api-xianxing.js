import _debug from 'debug';
const debug = _debug('app:api-xianxing');

import qs from 'qs';
import moment from 'moment';
import Errcode, { EC, EM } from '../Errcode';
import { requestGet } from '../utils/_request';

moment().locale('zh');

// 车辆限行接口
// https://market.aliyun.com/products/57002002/cmapi011138.html?spm=5176.730005.productlist.d_cmapi011138.FhqJdT#sku=yuncode513800005

let cityMap = {};

export default class Service {
  constructor(app, config) {
    this.app = app;
    this.config = config;
    // this.config = {
    //   AppCode:'<your-app-code>'
    // }

    this.city = this.city.bind(this);
    this.query = this.query.bind(this);

    this.registerServices();
  }

  registerServices() {
    debug('register vehiclelimit')
    let prefix = '/apis/v1/vehiclelimit';
    let router = require('koa-router')({ prefix });
    //v3
    router.get('/city', this.city);
    router.get('/query', this.query);

    this.app.use(async (ctx, next) => {
      if (ctx.path.startsWith(prefix)) {
        try {
          debug('path:', ctx.path, prefix);
          let result = await next();
        } catch (e) {
          debug('error:', e);
          let errcode = e.errcode || -1;
          let message = EM[errcode] || e.message || '未知错误';
          ctx.body = { errcode, message, xOrigMsg: e.message };
        }
        return;
      } else {
        await next();
      }
    });
    this.app.use(router.routes()).use(router.allowedMethods());
    this.app.use(async (ctx, next) => {
      if (ctx.path.startsWith(prefix)) {
        ctx.body = {
          errcode: -2,
          message: 'no such api: ' + ctx.path
        };
        return;
      }
      await next();
    });
  }

  /**
   * @api {GET} /apis/v1/vehiclelimit/city 获取限行城市列表
   * @apiDescription 获取有限行正常的城市列表<br/>
   * 接口文档:<https://market.aliyun.com/products/57002002/cmapi011138.html?spm=5176.730005.productlist.d_cmapi011138.FhqJdT#sku=yuncode513800005><br/>
   * API:<https://jisuclwhxx.market.alicloudapi.com/vehiclelimit/city><br/>
   * @apiName city
   * @apiGroup WindMicroService
   * @apiVersion 1.0.0
   * @apiSuccess {Object} result of operation, {errcode:0,message,result}, errcode=0 when success, file is the dest filepath.
   * @apiError errcode!=0 error occurs.
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
    {
      errcode:0,
      message,
      result:  [
        {
            "city": "beijing",
            "cityname": "北京"
        },
        {
            "city": "tianjin",
            "cityname": "天津"
        }
      ]
    }
   */
  async city(ctx, next) {
    let options = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'APPCODE '+this.config.AppCode
      },
      credentials: false
    }
    let obj = await requestGet('https://jisuclwhxx.market.alicloudapi.com/vehiclelimit/city',options);

    ctx.body = {
      errcode: 0,
      message: 'ok',
      result: obj.result
    };
    return;
  }

  /**
   * @api {GET} /apis/v1/vehiclelimit/query 获取指定城市指定日期限行政策.
   * @apiDescription 只缓存最后查询的那一天限行政策<br/>
   * 接口文档:<https://market.aliyun.com/products/57002002/cmapi011138.html?spm=5176.730005.productlist.d_cmapi011138.FhqJdT#sku=yuncode513800005><br/>
   * API:<https://jisuclwhxx.market.alicloudapi.com/vehiclelimit/query?city=beijing&date=2018-08-12><br/>
   * @apiName query
   * @apiGroup WindMicroService
   * @apiVersion 1.0.0
   * @apiParam {String} city="beijing"  Mandatory 城市.
   * @apiParam {String} date="2018-08-12"  Optional 日期,不填默认为当天.
   * @apiSuccess {Object} result of operation, {errcode=0,message,result}, errcode=0 when success, file is the dest filepath.
   * @apiError errcode!=0 error occurs.
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
    {
      errcode:0,
      message,
      result: {
        "city": "beijing",
        "cityname": "北京",
        "date": "2018-08-15",
        "week": "星期三",
        "time": [
            "07:00-20:00"
        ],
        "area": "五环路（不含）以内道路",
        "summary": "本市号牌尾号限行;外地号牌工作日(07:00-09:00、17:00-20:00)全部限行，其他限行时间内尾号限行;法定上班的周六周日不限行。",
        "numberrule": "车牌号码最后一位数字，尾号为字母的按0号处理",
        "number": "5和0"
      }
    }
   */
  async query(ctx, next) {
    let { city, date } = ctx.request.query;
    if (!city) {
      throw new Errcode('error! params has no city!', EC.ERR_PARAM_ERROR);
    }
    if (!date) {
      date = new Date();
    }
    let thatTime = moment(date);
    if (!thatTime.isValid()) {
      throw new Errcode('error! invalid date!', EC.ERR_PARAM_ERROR);
    }
    let thatDate = thatTime.format("YYYY-MM-DD");
    debug('date:', date, ', thatTime:', thatTime, ', thatDate:', thatDate, cityMap);

    let options = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'APPCODE '+this.config.AppCode
      },
      credentials: false
    }
  
    let needFetchCity = true;
    if (cityMap && cityMap.time && (Math.abs(new Date().getTime() - cityMap.time.getTime()) < 24*60*60 * 1000)) {
      needFetchCity=false;
    }
    if (needFetchCity) {
      let obj = await requestGet('https://jisuclwhxx.market.alicloudapi.com/vehiclelimit/city', options);
      if (obj && obj.result) { 
        obj.result.map (item => {
          if (!cityMap[item.city])
            cityMap[item.city] = item
        })
        cityMap.time = new Date();
      } else {
        debug('warning! get city fail!', obj);
      }
    }
    
    let result = {};
    if (cityMap && cityMap[city]) {
      // 有限行政策,
      if (cityMap[city].date == thatDate) {
        // 当前政策为指定天的政策.这里有优化空间.可以缓存更多日期.
        result = cityMap[city];
      } else {
        // 指定天没有,获取指定天,并更新到cityMap
        let obj = await requestGet('https://jisuclwhxx.market.alicloudapi.com/vehiclelimit/query?'+qs.stringify({city, date:thatDate}),options);
        if (obj.status == 0) {
          cityMap[city] = {city, ...(obj.result||{}) };
        } else {
          debug('warning! query fail!', obj);
        }
      }
      result = cityMap[city];
    } else {
      // 没有限行政策
    }

    ctx.body = {
      errcode: 0,
      message: 'ok',
      result: result
    };
    return;
  }
}
