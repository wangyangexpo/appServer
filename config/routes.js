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

	router.post('/creations/video', App.hasBody, App.hasToken, Creation.video);

	router.post('/creations/audio', App.hasBody, App.hasToken, Creation.audio);

	router.post('/creations', App.hasBody, App.hasToken, Creation.save);

	router.get('/creations', App.hasBody, App.hasToken, Creation.getCreations);

	router.get('/comments', App.hasBody, App.hasToken, Creation.getComments);

	return router;
}