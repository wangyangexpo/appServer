'use strict'

var mongoose = require('mongoose');
var User = mongoose.model('User');
var xss = require('xss');
var uuid = require('uuid');
var sms = require('../service/messageService')

exports.signup = function *(next) {
	var phoneNumber = xss(this.request.body.phoneNumber.trim());

	var user = yield User.findOne({
		phoneNumber: phoneNumber
	}).exec();

	var verifyCode = sms.getCode();

	if(!user) {
		// 第一次发送
		var accessToken = uuid.v4();

		user = new User({
			nickName: '小狗狗',
			phoneNumber: xss(phoneNumber),
			verifyCode: verifyCode,
			accessToken: accessToken,
			avatar: 'http://res.cloudinary.com/wangyangcloud/image/upload/v1488854732/avatar/anhxvnfgexnhilrxihff.jpg'
		})
	}
	else {
		// 非第一次
		user.verifyCode = verifyCode
	}

	try {
		yield user.save()
	} catch(e) {
		this.body = {
			success: false
		}
		return next;
	}

	var msg = '您的验证码是：' + verifyCode;

	try {
		sms.send(phoneNumber, msg);
	} catch(e) {
		console.log(e);
		this.body = {
			success: false,
			err: '短信服务异常'
		}

		return next;
	}
	

	this.body = {
		success: true
	}
}

exports.verify = function *(next) {
	var phoneNumber = this.request.body.phoneNumber;
	var verifyCode = this.request.body.verifyCode;

	if(!phoneNumber || !verifyCode) {
		this.body = {
			success: false,
			err: '验证不通过'
		}

		return next;
	}

	var user = yield User.findOne({
		phoneNumber: phoneNumber,
		verifyCode: verifyCode
	}).exec();

	if(user) {
		user.verified = true;
		user = yield user.save();

		this.body = {
			success: true,
			data: {
				nickName: user.nickName,
				accessToken: user.accessToken,
				avatar: user.avatar,
				_id: user._id
			}
		}
	}
	else {
		this.body = {
			success: false,
			err: '验证不通过'
		}

		return next;
	}
}

exports.update = function *(next) {
	var body = this.request.body;
	var user = this.session.user;

	['avatar','gender','age','nickName','breed'].forEach(function(field) {
		if(body[field]) {
			user[field] = xss(body[field].trim())
		}
	})

	user = yield user.save();

	this.body = {
		success: true,
		data: {
			nickName: user.nickName,
			accessToken: user.accessToken,
			avatar: user.avatar,
			age: user.age,
			breed: user.breed,
			gender: user.gender,
			_id: user._id
		}
	}
}