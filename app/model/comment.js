'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;
var Mixed = Schema.Types.Mixed;

var CommentSchema = new Schema({

	authorId: {
		type: ObjectId,
		ref: 'User'
	},

	author: Mixed,

	content: String,

	creationId: {
		type: ObjectId,
		ref: 'Creation'
	},

	creation: Mixed,
	
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

CommentSchema.pre('save', function(next) {
	if(this.isNew) {
		this.meta.createAt = this.meta.updateAt = Date.now();
	}
	else {
		this.meta.updateAt = Date.now();
	}

	next();
})

module.exports = mongoose.model('Comment', CommentSchema)