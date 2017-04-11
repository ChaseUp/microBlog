var config = require('config-lite');
var moment = require('moment');
var objectIdToTimestamp = require('objectid-to-timestamp');
var Mongolass = require('mongolass');
var mongolass = new Mongolass();
mongolass.connect(config.mongodb);

// 根据id生成创建时间created_at
mongolass.plugin('addCreatedAt',{
	afterFind: function(results){
		results.forEach(function(item){
			item.created_at = moment(objectIdToTimestamp(item._id)).format('YYYY-MM-DD HH:mm');
		});
		return results;
	},
	afterFindOne: function(result){
		if (result) {
			result.created_at = moment(objectIdToTimestamp(result._id)).format('YYYY-MM-DD HH:mm');
		}
		return result;
	}
})

// 定义用户表的 schema，生成并导出 User 这个 model，同时设置 name 的唯一索引，保证用户名是不重复的
exports.User = mongolass.model('User',{
	name: {type: 'string'},
	password: {type: 'string'},
	avatar: {type: 'string'},
	gender: {type: 'string', enum: ['m','f','x']},
	bio: {type: 'string'}
});

exports.Post = mongolass.model('Post',{
	author: {type: Mongolass.Types.ObjectId},
	title: {type: 'string'},
	content: {type: 'string'},
	pv: {type: 'number'}
});

exports.Comment = mongolass.model('Comment',{
	author: {type: Mongolass.Types.ObjectId},
	postId: {type: Mongolass.Types.ObjectId},
	content: {type: 'string'}
});

exports.User.index({name: 1}, {unique: true}).exec();
exports.Post.index({author: 1, _id: -1}).exec();	// 按创建时间降序查看用户的文章列表
exports.Comment.index({postId: 1, _id: 1}).exec();	// 通过文章id获取该文章下所有留言，按留言创建时间升序
exports.Comment.index({author: 1, _id: 1}).exec();	// 通过用户id和留言id删除一个留言