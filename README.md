## 项目简介
这是微服务限行接口服务器

## 文档
[在线api文档](https://windsome.github.io/wind-micro-service/index.html)

## 打包发布流程
1. 编译及打包发布
```
npm install
npm run build
npm run tar
scp bz2-server.tar.bz2 root@qingshansi:/data/nodejs/wind-micro-service/
```

## 用node直接运行
```
npm install
npm run build
XX_APPCODE="your-app-code" node sdist
```
部署或运行时,注意设置环境变量XX_APPCODE为自己的.
## 用apidoc生成接口文档
```
npm run apidoc
```

## 注意事项
1. 安装apidoc
默认apidoc在处理json的POST、PUT时有问题，是按formdata传的。需要使用插件`npm install --save-dev https://github.com/koko-ng/apidoc-contentType-plugin`，之后在`package.json`中增加一条命令`"apidoc": "apidoc -i src/ -o doc/apis/ -t node_modules/apidoc-contenttype-plugin/template/ --parse-parsers apicontenttype=node_modules/apidoc-contenttype-plugin/api_content_type.js"`，以后可以运行`npm run apidoc`生成文档