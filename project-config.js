'use strict'


const path = require('path');
const utils = require('./build/utils');
const npmConfig = require("./package.json");



function resolve(dir) {
  return path.join(__dirname, dir)
}


var projecConfig = {

  /* 
  webpack 的入口文件
   */
  entry: "./src/conditionOperat.ts",

  /* 
  webpack 的 target
  */
  target: "web",  //node  web 等等

  /* 
  webpack 的 输出文件的名字； 默认值：'[name].js'
  */
  // filename:"",

   /* 
  库的名字
  https://webpack.docschina.org/configuration/output/#output-library

  utils.stringToCamelFormat(npmConfig.name) 的作用是把 package.json 中的 name 字段的值 从 中划线 或 下划线 分隔的方式 转成 驼峰式
  */
 library: utils.stringToCamelFormat(npmConfig.name),

  /* 
  配置如何暴露 library
  */
  libraryTarget: "umd",

  /* 
  库中被导出的项
  */
  libraryExport: "conditionOperat",

  alias: {
    // '@': resolve('src'),
  },

  /* 
  排除依赖的模块
  */
  externals: {},

  /* 
  html模板文件；
  */
  // htmlTemplate:"index.html",

  /* 
  Template for index.html
  */
  htmlOut: 'index.html',


  /* 
  静态资源目录
  */
  // staticDirectory:"static",

  /* 
  静态资源输出目录， 如; static
  */
  staticOutDirectory: 'static',




  // TypeScript配置:开始


  /*
  指定ECMAScript目标版本 "ES3"（默认）， "ES5"， "ES6"/ "ES2015"， "ES2016"， "ES2017"或 "ESNext"。
  */
  tsTarget: "ESNext",

  /*
  指定生成哪个模块系统代码： "None"， "CommonJS"， "AMD"， "System"， "UMD"， "ES6"或 "ES2015"。
  默认值是： target === "ES6" ? "ES6" : "commonjs"
   */
   module:"ES6",

  /* 
  生成相应的 .d.ts文件。
  */
  declaration: true,





  /* 
  tsParseLoader : "ts-loader" | "babel-loader" ；默认值："ts-loader"
  配置解析 TypeScript 的 loader

  目前，解析 TypeScript 的 loader 有两个： "ts-loader" 和 "babel-loader"

  注意，目前发现：
  - "ts-loader" 会忽略TypeScript中默认的导出项 `export default`，这时配置项 ` libraryExport: "default" ` 可能会导到导出的值是 undefined
  - "babel-loader" 暂未支持生成 声明文件 .d.ts，并且会忽略 项目中关于 TypeScript 的自定配置，如：tsconfig.json、tsconfig.dev.js、tsconfig.prod.js 中的配置
  */
 tsParseLoader:"ts-loader",


  // TypeScript配置:结束


  dev: {
    /* 
    输出目录
    */
    outputPath: resolve("dev"),


    /* 
     Use Eslint Loader?
     If true, your code will be linted during bundling and
     linting errors and warnings will be shown in the console.
    */
    useEslint: true,

    /* 
     If true, eslint errors and warnings will also be shown in the error overlay
     in the browser.
     */
    showEslintErrorsInOverlay: false,

    /*
     Source Maps
     https://webpack.js.org/configuration/devtool/#development
     */
    devtool: 'cheap-module-eval-source-map',
    sourceMap: true,
    cssSourceMap: true,
  },

  build: {
    // 输出目录
    outputPath: resolve("dist"),

    /* 
    Source Maps
    https://webpack.js.org/configuration/devtool/#production 
    */
    devtool: '#source-map',
    sourceMap: true,


    /* 
    Run the build command with an extra argument to
    View the bundle analyzer report after build finishes:
    `npm run build --report`
    Set to `true` or `false` to always turn it on or off
    */
    bundleAnalyzerReport: process.env.npm_config_report,
  },


  /* 
  配置多个构建目标
  */
  multipleTargets: []

}





module.exports = utils.projecConfigMultipleTargetsSeparation(projecConfig);