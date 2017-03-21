'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;
var Mixed = Schema.Types.Mixed;

var PictureSchema = new Schema({
	author: {
		type: ObjectId,
		ref: 'User'
	},

	qiniu_key: String,
	creation: {
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

PictureSchema.pre('save', function(next) {
	if(this.isNew) {
		this.meta.createAt = this.meta.updateAt = Date.now();
	}
	else {
		this.meta.updateAt = Date.now();
	}

	next();
})

module.exports = mongoose.model('Picture', PictureSchema)