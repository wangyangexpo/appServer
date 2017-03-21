'use strict'

var mongoose = require('mongoose');

var User = mongoose.model('User');
var config = require('../../config/config');
var robot = require('../service/robot');

exports.signature = function *(next) {

	var body = this.request.body;
	var data = robot.getQiniuToken(body);

	this.body = {
		success: true,
		data: data
	}
}

exports.hasBody = function *(next) {
	var body = this.request.body || {};
	if(Object.keys(body) === 0)  {
		this.body = {
			success: true,
			err: '是不是漏掉参数了'
		}
		return next;
	}

	yield next;
}

exports.hasToken = function *(next) {
	var accessToken = this.query.accessToken || this.request.body.accessToken;
	if(!accessToken) {
		this.body = {
			success: false,
			err: '钥匙丢了'
		}
		return next;
	}

	var user = yield User.findOne({
		accessToken: accessToken
	})

	if(!user) {
		this.body = {
			success: false,
			err: '没有登录吧'
		}
		return next;
	}

	this.session = this.session || {};
	this.session.user = user;

	yield next;
}