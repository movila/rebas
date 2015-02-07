/**
 * @file server
 * @author treelite(c.xinle@gmail.com)
 */

var express = require('express');
var mm = require('saber-mm');
var router = require('./lib/router');
var Element = require('./lib/Element');
var getConfig = require('./lib/util/get-config');
var config = require('./lib/config');

// 从命令行参数获取配置文件夹地址
var configDir = process.argv[2];
config.configDir = configDir || config.configDir;

// 初始化日志模块
var log = require('./lib/log');
log.init();

// 启动tpl扩展
require('./lib/tpl');

/**
 * 运行Presenter
 *
 * @inner
 * @param {Object} route 路由信息
 * @param {Object} route.action Presenter配置
 * @param {string} path 请求路径
 * @param {Object} query 请求参数
 * @param {Object} res 请求响应对象
 * @param {Function} next 执行下一个路由处理器
 */
function run(route, path, query, res, next) {
    var presenter = mm.create(route.action);
    var ele = new Element('div');

    presenter
        .enter(ele, path, query)
        .then(
            function () {
                var model = presenter.model;
                res.html = ele.outerHTML;
                res.data = model.store;
                next();
            },
            next
        );
}

/**
 * 附加中间件
 *
 * @param {Object} app
 */
function attachMiddleware(app) {
    app.use(log.express());
    app.use(require('./lib/middleware/init'));
    router.use(app);
    app.use(require('./lib/middleware/renderHTML'));
}

/**
 * 加载路由信息
 *
 * @public
 * @param {Object|Array.<Object>} routes 路由信息
 */
exports.load = function (routes) {
    if (!Array.isArray(routes)) {
        routes = [routes];
    }
    routes.forEach(function (route) {
        router.add(route.path, run.bind(null, route));
    });
};

/**
 * 启动Server
 *
 * @public
 * @param {number} port 端口
 * @param {Object} options 配置信息
 */
exports.start = function (port, options) {
    log.info('server starting ...');

    port = port || config.port;
    options = options || {};
    mm.config({
        template: options.template || '',
        templateConfig: options.templateConfig || {},
        templateData: options.templateData || {}
    });

    var app = express();

    attachMiddleware(app);

    app.listen(port);

    log.info('server start at %s', port);
};

/**
 * 获取配置项信息
 *
 * @public
 * @param {string} name 配置项文件名
 * @return {Object|Array}
 */
exports.get = function (name) {
    return getConfig(name);
};
