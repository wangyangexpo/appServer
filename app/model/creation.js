'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;
var Mixed = Schema.Types.Mixed;
var Comment = mongoose.model('Comment');

var CreationSchema = new Schema({

	author: {
		type: ObjectId,
		ref: 'User'
	},

	qiniu_key: String,

	story: String,

	voted: Boolean,

	likeTotal: {
		type: Number,
		default: 0
	},

	commentTotal: {
		type: Number,
		default: 0
	},
	
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