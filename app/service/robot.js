'use strict'

var qiniu = require('qiniu');
var cloudinary = require('cloudinary');
var config = require('../../config/config');
var sha1 = require('sha1');
var uuid = require('uuid');
var Promise = require('bluebird');

qiniu.conf.ACCESS_KEY = config.qiniu.AK;
qiniu.conf.SECRET_KEY = config.qiniu.SK;

cloudinary.config(config.cloudinary);

var bucket = 'avatar';

exports.saveToQiniu = function(url, key) {
	var Client = new qiniu.rs.Client();

	return new Promise(function(resolve, reject) {
		console.log(url);
		console.log(key);
		Client.fetch(url, 'computed-video-and-image', key, function(err, ret) {
			if(err) {
				console.log('这里出错了。。。。。。');
				reject(err);
			}
			else {
				console.log(ret);
				resolve(ret);
			}
		})
	})

}

exports.getQiniuToken = function(body) {
	var type = body.type;
	var	key = uuid.v4() + '.jpeg';
	var putPolicy;
	var options = {
		persistentNotifyUrl: config.notify
	}

	if(type === 'avatar') {
		//putPolicy.callbackUrl = 'http://your.domain.com/callback';
    	//putPolicy.callbackBody = 'filename=$(fname)&filesize=$(fsize)';
		key += '.jpeg';
		putPolicy = new qiniu.rs.PutPolicy(bucket + ':' + key);
	} else if(type === 'video') {
		key += '.mp4';
		options.scope = 'video:' + key;
		options.persistentOps = 'avthumb/mp4/an/1';
		putPolicy = new qiniu.rs.PutPolicy2(options);
	} else if(type === 'audio') {
		//
	}
    var token = putPolicy.token();
    return {
    	token: token,
    	key: key
    };
}

exports.getCloudinaryToken = function(body) {
	var type = body.type;
	var timestamp = body.timestamp;
	var folder; 
	var tags;

	if(type === 'avatar') {
		folder = 'avatar',
		tags = 'app,avatar'
	}
	else if(type === 'video') {
		folder = 'video',
		tags = 'app,video'
	}
	else if(type === 'audio') {
		folder = 'audio',
		tags = 'app,audio'
	}
	var signature = 'folder=' + folder + '&tags=' + tags +
            '&timestamp=' + timestamp + config.cloudinary.api_secret;
    signature = sha1(signature);

    var key = uuid.v4();
    return {
    	token: signature,
    	key: key
    };
}

exports.uploadToCloudinary = function(url) {
	return new Promise(function(resolve, reject) {
		cloudinary.uploader.upload(url, function(result) {
			if(result && result.public_id) {
				resolve(result);
			}
			else {
				reject(result)
			}
		}, {
			resource_type: 'video',
			folder: 'video'
		})
	})
}
