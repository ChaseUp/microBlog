var express = require('express');
var UserModel = require('../models/users')
var sha1 = require('sha1');
var checkNotLogin = require('../middlewares/check').checkNotLogin;
var router = express.Router();

// get登录页
router.get('/',checkNotLogin,function(req,res){
	res.render('signin');
});

// 用户登录
router.post('/',checkNotLogin,function(req,res,next){
	console.log(req);
	var name = req.fields.name;
	var password = req.fields.password;

	UserModel.getUserByName(name).then(function(user){
		if (!user) {
			req.flash('error','用户不存在');
			return res.redirect('back');
		}
		// 检查密码是否正确
		if (sha1(password) !== user.password) {
			req.flash('error','密码不正确');
			return res.redirect('back');
		}
		req.flash('success','登录成功');
		// 用户session写入
		delete user.password;
		req.session.user = user;
		res.redirect('/posts');
	}).catch(next);
});

module.exports = router;