'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;

var LikeSchema = new Schema({
	userId: {
		type: ObjectId,
		ref: 'User'
	},

	creationId: {
		type: ObjectId,
		ref: 'Creation'
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

LikeSchema.pre('save', function(next) {
	if(this.isNew) {
		this.meta.createAt = this.meta.updateAt = Date.now();
	}
	else {
		this.meta.updateAt = Date.now();
	}

	next();
})

module.exports = mongoose.model('Like', LikeSchema)