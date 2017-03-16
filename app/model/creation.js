'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;
var Mixed = Schema.Types.Mixed;

var CreationSchema = new Schema({

	author: {
		type: ObjectId,
		ref: 'User'
	},

	videoId: {
		type: ObjectId,
		ref: 'video'
	},

	audioId: {
		type: ObjectId,
		ref: 'audio'
	},

	thumb: String,

	video: String,

	title: String,
	
	meta: {
		createAt: {
			type: Date,
			default: Date.now()
		},
		updateAt: {
			type: Date,
			default: Date.now()
		}
	}
})

CreationSchema.pre('save', function(next) {
	if(this.isNew) {
		this.meta.createAt = this.meta.updateAt = Date.now();
	}
	else {
		this.meta.updateAt = Date.now();
	}

	next();
})

module.exports = mongoose.model('Creation', CreationSchema)