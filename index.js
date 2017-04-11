var express = require('express');
var path = require('path');
var routes = require('./routes');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var flash = require('connect-flash');
var config = require('config-lite');
var pkg = require('./package');
var app = express();
var port = 3000;

app.set('views',path.join(__dirname + '/views'));
app.set('view engine','ejs');
app.use(express.static(path.join(__dirname + '/public')));

// session中间件
app.use(session({
	name: config.session.key,
	secret: config.session.secret,
	resave: true,
	saveUninitialized: false,
	cookie: {
		maxAge: config.session.maxAge
	},
	store: new MongoStore({
		url: config.mongodb
	})
}));

// flash中间件
app.use(flash());

// 处理表单及文件上传中间件
app.use(require('express-formidable')({
	uploadDir: path.join(__dirname,'public/images'),	// 上传文件目录
	keepExrensions: true	// 保留后缀
}))

// 设置模板全局常量
app.locals.blog = {
	title: pkg.name,
	description: pkg.description
};

// 添加模板必须的三个变量
app.use(function(req,res,next){
	res.locals.user = req.session ? req.session.user : '';
	res.locals.success = req.flash('success').toString();
	res.locals.error = req.flash('error').toString();
	next();
});

routes(app);

// error page
app.use(function(err,req,res,next){
	res.render('error',{
		error: err
	});
});

app.listen(config.port,function(){
	console.log(`app is listening ${config.port}`);
});