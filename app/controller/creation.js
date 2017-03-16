'use strict'

var mongoose = require('mongoose');

var User = mongoose.model('User');
var Video = mongoose.model('Video');
var Audio = mongoose.model('Audio');
var Creation = mongoose.model('Creation');
var config = require('../../config/config');
var robot = require('../service/robot');
var Promise = require('bluebird');

const pageSize = 4;

function AsyncMedia(videoId, audioId) {
	console.log(videoId);
	console.log(audioId);
	if(!videoId) {
		return;
	}

	var query = {
		_id: audioId
	}

	if(!audioId) {
		query = {
			video: videoId
		}
	}

	Promise.all([
		Video.findOne({_id: videoId}).exec(),
				Audio.findOne(query).exec()])
			.then(function(data) {
				var video = data[0];
				var audio = data[1];

				console.log('检查数据');
				if(!video || !video.public_id || !audio || !audio.public_id) {
					return;
				}
				console.log('开始同步音频，视频');
				var video_public_id = video.public_id;
				var audio_public_id = audio.public_id.replace('/', ':');
				var videoName = video_public_id.replace('/', '_') + '.mp4';
				var videoUrl = 'http://res.cloudinary.com/wangyangcloud/video/upload/e_volume:-100/e_volume:400,' + 
					'l_video:' + audio_public_id + '/' + video_public_id + '.mp4';
				var thumbName = video_public_id.replace('/', '_') + '.jpg';
				var thumbUrl = 'http://res.cloudinary.com/wangyangcloud/video/upload/' + video_public_id + '.jpg';

				console.log('同步视频到qiniu');

				robot.saveToQiniu(videoUrl, videoName)
					.catch((err) => {
						console.log(err);
					})
					.then((response) => {
						if(response && response.key) {
							audio.qiniu_video = response.key;
							
							audio.save().then(function(_audio) {
								console.log('同步视频成功');
							});
						}
					})

				robot.saveToQiniu(thumbUrl, thumbName)
					.catch((err) => {
						console.log(err);
					})
					.then((response) => {
						if(response && response.key) {
							audio.qiniu_thumb = response.key;
							
							audio.save().then(function(_audio) {
								console.log('同步封面成功');
							});
						}
					})
			})

}

exports.audio = function *(next) {

	var _this = this;
	var body = this.request.body;
	var audioData = body.audio;
	var user = this.session.user;
	var videoId = body.videoId;

	if(!audioData || !audioData.public_id) {
		this.body = {
			success: false,
			err: '音频没有上传成功'
		}
		return next;
	}

	var audio = yield Audio.findOne({
		public_id: audioData.public_id
	})
	.exec();

	var video = yield Video.findOne({
		_id: videoId
	})
	.exec();

	if(!audio) {
		var _audio = {
			author: user._id,
			public_id: audioData.public_id,
			detail: audioData
		}

		if(video) {
			_audio.video =video._id;
		}

		audio = new Audio(_audio);
		audio = yield audio.save(function(err, newAudio) {

			if(err) {
				_this.body = {
					success: false,
					data: null
				}
				console.log(err)
				return;
			}

			_this.body = {
				success: true,
				data: newAudio._id
			}

			console.log('newAudio' + newAudio._id);
			AsyncMedia(videoId, newAudio._id)
		});
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

	var url = config.qiniu.video + video.qiniu_key;
	
	robot.uploadToCloudinary(url)
		 .then((data) => {
		 	if(data && data.public_id) {
		 		console.log('upload video to cloudinary success');
		 		video.public_id = data.public_id;
		 		video.detail = data;
		 		video.save().then(function(_video){
	 				//AsyncMedia(_video.id)
		 		});
		 	}
		 })
		 .catch((err) => {
		 	console.log(err);
		 })

	this.body = {
		success: true,
		data: video._id
	}
}

exports.save = function *(next) {
	var _this = this;
	var body = this.request.body;
	var videoId = body.videoId;
	var audioId = body.audioId;
	var title = body.title;
	var user = this.session.user;
	var audio = yield Audio.findOne({
		_id: audioId
	})

	var creation = new Creation({
		author: user._id,
		videoId: videoId,
		audioId: audioId,
		thumb: audio.qiniu_thumb,
		video: audio.qiniu_video,
		title: title
	});

	yield creation.save(function(err, creation) {
		if(creation._id) {
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

	var start = yield Creation.findOne({_id: startId});
	var end = yield Creation.findOne({_id: endId});

	if(page == 1) {
		// 第一次进list
		creations = yield Creation.find({})
					.sort({'meta.createAt':-1})
					.limit(pageSize);
	} else if(page == 0) {
		// 顶部刷新 获取最新的数据
		creations = yield Creation.find({})
					.where('meta.createAt').gt(start.meta.createAt)
					.sort({'meta.createAt': 1})
					.limit(pageSize);
		creations = creations.reverse();
	} else {
		// 底部刷新 获取历史数据
		creations = yield Creation.find({})
					.where('meta.createAt').lt(end.meta.createAt)
					.sort({'meta.createAt': -1})
					.limit(pageSize);
	}

	var len = yield Creation.find({}).count();

	_this.body = {
		success: true,
		data: creations,
		total: len
	}
	
}

exports.getComments = function *(next) {
	var _this = this;
	var creationId = this.query.creationId;
	var accessToken = this.query.accessToken;

	_this.body = {
		success: true,
		data: [],
		total: 0
	}
	
}


