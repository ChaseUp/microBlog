var express = require('express');
var checkLogin = require('../middlewares/check').checkLogin;
var PostModel = require('../models/posts');
var CommentModel = require('../models/comments');
var router = express.Router();

// get文章页
router.get('/',function(req,res,next){
	var author = req.query.author;
	PostModel.getPosts(author).then(function(posts){
		res.render('posts',{
			posts: posts
		});
	}).catch(next);
});

// 发表一篇文章
router.post('/',checkLogin,function(req,res,next){
	var title = req.fields.title;
	var content = req.fields.content;
	var author = req.session.user._id;

	// 校验参数
	try {
		if (title === '') {
			throw new Error('标题不能为空');
		}
		if (content == '') {
			throw new Error('内容不能为空');
		}
	} catch (err) {
		req.flash('error',err.message);
		return res.redirect('back');
	}
	var post = {
		title: title,
		content: content,
		author: author,
		pv: 0
	};

	PostModel.create(post).then(function(result){
		// 此post是插入mobgodb后的值，包含_di
		post = result.ops[0];
		req.flash('success','发表成功');
		res.redirect(`/posts/${post._id}`);
	}).catch(next);
});

// get发表文章页
router.get('/create',checkLogin,function(req,res){
	res.render('create');
});

// get单独一篇文章页
router.get('/:postId',function(req,res,next){
	var postId = req.params.postId;

	Promise.all([
		PostModel.getPostById(postId),	// 获取文章信息
		CommentModel.getComments(postId),	// 获取该文章所有留言
		PostModel.incPv(postId)	// pv加1
	]).then(function(result){
		var post = result[0];
		var comments = result[1];
		if (!post) {
			// throw new Error('该文章不存在');
			res.render('404');
			return;
		}
		res.render('post',{
			post: post,
			comments: comments
		});
	}).catch(next);
});

// get更新文章页
router.get('/:postId/edit',checkLogin,function(req,res,next){
	var postId = req.params.postId;
	var author = req.session.user._id;

	PostModel.getRawPostById(postId).then(function(post){
		if (!post) {
			throw new Error('该文章不存在');
		}
		if (author.toString() !== post.author._id.toString()) {
			throw new Error('权限不足');
		}
		res.render('edit',{
			post: post
		});
	}).catch(next);
});

// 更新一篇文章
router.post('/:postId/edit',checkLogin,function(req,res,next){
	var postId = req.params.postId;
	var author = req.session.user._id;
	var title = req.fields.title;
	var content = req.fields.content;

	PostModel.updatePostById(postId,author,{title: title,content: content}).then(function(){
		req.flash('success','编辑文章成功');
		res.redirect(`/posts/${postId}`);
	}).catch(next);
});

// 删除一篇文章
router.get('/:postId/remove',checkLogin,function(req,res,next){
	var postId = req.params.postId;
	var author = req.session.user._id;

	PostModel.delPostById(postId,author).then(function(){
		req.flash('success','删除成功');
		res.redirect('/posts');
	}).catch(next);
});

// 创建一条留言
router.post('/:postId/comment',checkLogin,function(req,res,next){
	var postId = req.params.postId;
	var author = req.session.user._id;
	var content = req.fields.content;
	var comment = {
		postId: postId,
		author: author,
		content: content
	};

	CommentModel.create(comment).then(function(){
		req.flash('success','留言成功');
		res.redirect('back');
	}).catch(next);
});

// 删除一条留言
router.get('/:postId/comment/:commentId/remove',checkLogin,function(req,res,next){
	var commentId = req.params.commentId;
	var author = req.session.user._id;

	CommentModel.delCommentById(commentId,author).then(function(){
		req.flash('success','删除成功');
		res.redirect('back');
	}).catch(next);
});

module.exports = router;