'use strict'

var mongoose = require('mongoose');
var _ = require('lodash');

var User = mongoose.model('User');
var Video = mongoose.model('Video');
var Picture = mongoose.model('Picture');
var Creation = mongoose.model('Creation');
var Comment = mongoose.model('Comment');
var Like = mongoose.model('Like');
var config = require('../../config/config');
var robot = require('../service/robot');
var Promise = require('bluebird');

// 列表页每次 加载 多少数据
const listSize = 4;
// 详情页每次加载多少 评论
const commentSize = 4;

exports.picture = function *(next) {
	var body = this.request.body;
	var pictureData = body.picture;
	var user = this.session.user;

	if(!pictureData || !pictureData.key) {
		this.body = {
			success: false,
			err: '图片没有上传成功'
		}
		return next;
	}

	var picture = yield Picture.findOne({
		qiniu_key: pictureData.key
	})
	.exec();

	if(!picture) {
		picture = new Picture({
			author: user._id,
			qiniu_key: pictureData.key,
			persistentId: pictureData.persistentId
		})

		picture = yield picture.save()
	}

	this.body = {
		success: true,
		data: picture._id
	}
}

exports.video = function *(next) {

	var body = this.request.body;
	var videoData = body.video;
	var user = this.session.user;

	if(!videoData || !videoData.key) {
		this.body = {
			success: false,
			err: '视频没有上传成功'
		}
		return next;
	}

	var video = yield Video.findOne({
		qiniu_key: videoData.key
	})
	.exec();

	if(!video) {
		video = new Video({
			author: user._id,
			qiniu_key: videoData.key,
			persistentId: videoData.persistentId
		})

		video = yield video.save()
	}

	this.body = {
		success: true,
		data: video._id
	}
}

exports.save = function *(next) {
	var _this = this;
	var body = this.request.body;
	var videoId = body.videoId;
	var pictureId = body.pictureId;
	var story = body.story;
	var user = this.session.user;
	var media = {};
	if(videoId) {
		media = yield Video.findOne({
			_id: videoId
		})
		.exec();
	} else if (pictureId) {
		media = yield Picture.findOne({
			_id: pictureId
		})
		.exec();
	}

	var creation = new Creation({
		author: user._id,
		qiniu_key: media.qiniu_key,
		story: story
	});

	yield creation.save(function(err, creation) {
		if(creation._id) {
			console.log(creation);

			_this.body = {
				success: true
			}
		} else {
			_this.body = {
				success: false
			}
		}
	})
	
}

exports.getCreations = function *(next) {
	var _this = this;
	var page = this.query.page;
	var accessToken = this.query.accessToken;

	var creations = [];

	var startId = this.query.startId;
	var endId = this.query.endId;
	var user = this.session.user;

	if(page == 1) {
		// 第一次进list
		creations = yield Creation.find({})
					.sort({'_id':-1})
					.limit(listSize);
	} else if(page == 0) {
		// 顶部刷新 获取最新的数据
		creations = yield Creation.find({})
					.where('_id').gt(startId)
					.sort({'_id': 1})
					.limit(listSize);
		creations = creations.reverse();
	} else {
		// 底部刷新 获取历史数据
		creations = yield Creation.find({})
					.where('_id').lt(endId)
					.sort({'_id': -1})
					.limit(listSize);
	}

	var len = yield Creation.find({}).count();

	// 处理 点赞的情况
	var likeList = yield Like.find({userId: user._id});
	var clist = _.map(likeList, function(like) {
		return like.creationId + '';
	});
	creations = _.map(creations, function(c) {
		if(_.indexOf(clist, c._id + '') > -1) {
			c.voted = true;
		} else {
			c.voted = false;
		}
		return c
	})

	_this.body = {
		success: true,
		data: creations,
		total: len
	}
	
}

exports.Comment = function *(next) {
	var _this = this;
	var user = this.session.user;
	var body = this.request.body;
	var creationId = body.creation;
	var content = body.content;

	var creation = yield Creation.findOne({_id: creationId});

	if(creation) {
		var comment = new Comment({
			authorId: user._id,
			author: user,
			creationId: creationId,
			creation: creation,
			content: content
		});

		comment.save(function(err, comment) {
			if(!err) {
				creation.commentTotal += 1;
				creation.save();
			}else {
				_this.body = {
					success: false,
					err: '评论保存出错'
				}

				return next;
			}
		})
	} else {
		_this.body = {
			success: false,
			err: '囧事没有找到'
		}

		return next;
	}

	console.log(user);

	_this.body = {
		success: true,
		data: user
	}
}

exports.getComments = function *(next) {
	var _this = this;
	var creationId = this.query.creationId;
	var accessToken = this.query.accessToken;

	var page = this.query.page;
	var startId = this.query.startId;
	var endId = this.query.endId;

	var comments;

	if(page == 1) {
		// 第一次
		comments = yield Comment.find({creationId: creationId})
					.sort({'_id':-1})
					.limit(commentSize);
	} else {
		// 底部刷新 获取历史数据
		comments = yield Comment.find({creationId: creationId})
					.where('_id').lt(endId)
					.sort({'_id': -1})
					.limit(commentSize);
	}

	var total = yield Comment.find({creationId: creationId}).count();

	_this.body = {
		success: true,
		data: comments,
		total: total
	}
	
}

exports.Like = function *(next) {
	var _this = this;
	var user = this.session.user;
	var body = this.request.body;
	var creationId = body.creationId;
	var like = body.like;

	if(like) {
		var creation = yield Creation.findOne({_id: creationId});

		if(creation) {
			creation.likeTotal += 1;
			creation.save();
			var like = yield Like.findOne({
				userId: user._id,
				creationId: creationId
			})

			if(!like) {
				like = new Like({
					userId: user._id,
					creationId: creationId
				})
				like.save()
			}
		} else {
			_this.body = {
				success: false,
				err: '囧事没有找到'
			}
			return next;
		}
	} else {
		yield Like.remove({
				userId: user._id,
				creationId: creationId
			})
	}

	_this.body = {
		success: true
	}
}


