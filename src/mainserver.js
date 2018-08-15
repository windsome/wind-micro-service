import _debug from 'debug';
const debug = _debug('app:mainserver');
import 'isomorphic-fetch';
import Koa from 'koa';
import convert from 'koa-convert';
import cors from 'koa2-cors';
import parseUserAgent from './utils/userAgent';
import cfg from './cfg';
import ApiXianXing from './service/api-xianxing';
import { getXxAppCode } from './cfg/getCfg';

let packageJson = require('../package.json');
debug('SOFTWARE VERSION:', packageJson.name, packageJson.version);

const app = new Koa();
app.proxy = true;

// 跨域支持
app.use(
  cors({
    origin: ctx => {
      return '*';
      // if (ctx.url === '/test') {
      //     return "*"; // 允许来自所有域名请求
      // }
      // return 'http://localhost:8080'; / 这样就能只允许 http://localhost:8080 这个域名的请求了
    },
    // exposeHeaders: ['WWW-Authenticate', 'Server-Authorization'],
    // maxAge: 5,
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE']
    // allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
  })
);

let bodyParser = require('koa-bodyparser');
app.use(convert(bodyParser()));

app.use(async (ctx, next) => {
  let dbginfo = {
    // cookieHeader: ctx.headers.cookie,
    clientIP:
      (ctx.request.header && ctx.request.header['X-Real-IP']) || ctx.request.ip,
    query: ctx.request.query,
    body: ctx.request.body,
    referer: ctx.req.headers.referer,
    // Authorization: ctx.request.header && ctx.request.header['Authorization'],
    parsedAgent: parseUserAgent(
      ctx.request.header && ctx.request.header['user-agent']
    )
    // header: ctx.request.header
  };
  debug('[' + ctx.method + '] ' + ctx.path, dbginfo);
  await next();
});

//let json = require('koa-json'); // response json body.
//app.use(convert(json()));
let xxcfg = {
  AppCode: getXxAppCode()
}
app.XianXing = new ApiXianXing(app, xxcfg);

app.use(function(ctx, next) {
  debug('not done! [' + ctx.req.method + '] ' + ctx.path, ctx.req.url);
  ctx.status = 404;
});

export default app;
