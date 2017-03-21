 'use strict'

var Router = require('koa-router')
var User = require('../app/controller/user')
var App = require('../app/controller/app')
var Creation = require('../app/controller/creation')

module.exports = function() {
	var router = new Router({
		'prefix': '/api'
	});

	// 注册登录，验证码
	router.post('/u/signup', App.hasBody, User.signup);
	router.post('/u/verify', App.hasBody, User.verify);
	router.post('/u/update', App.hasBody, App.hasToken, User.update);

	// 获取签名
	router.post('/signature', App.hasBody, App.hasToken, App.signature);

	// 上传视频和图片
	router.post('/creations/video', App.hasBody, App.hasToken, Creation.video);
	router.post('/creations/picture', App.hasBody, App.hasToken, Creation.picture);

	// 发布 获取 囧事列表
	router.post('/creations', App.hasBody, App.hasToken, Creation.save);
	router.get('/creations', App.hasBody, App.hasToken, Creation.getCreations);


	// 评论
	router.get('/comments', App.hasBody, App.hasToken, Creation.getComments);
	router.post('/comments', App.hasBody, App.hasToken, Creation.Comment);

	// 喜欢
	router.post('/up', App.hasBody, App.hasToken, Creation.Like);

	return router;
}