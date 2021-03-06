//Routing Mechanism - URL Define Here.
const express = require('express');

//Express Only Get Data If Body-Parser Is Worked.
//To Get Value Of Any Control Body-Parser Is Compulsory.
var bodyParser = require('body-parser');

//Node Session and cookies
var cookieParser = require('cookie-parser');
var session = require('express-session');

//Object Of Express.
const app = express();
app.use(express.static('views'))
//Express Object Uses Body-Parser Object.
app.use(bodyParser.urlencoded({ extended: true }));

// initialize cookie-parser to allow us access the cookies stored in the browser. 
app.use(cookieParser());

// initialize express-session to allow us track the logged-in user across sessions.
app.use(session({
    key: 'user_sid',
    secret: 'somerandonstuffs',
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 600000
    }
}));


// This middleware will check if user's cookie is still saved in browser and user is not set, then automatically log the user out.
// This usually happens when you stop your express server after login, your cookie still remains saved in the browser.
app.use((req, res, next) => {
    if (req.cookies.user_sid && !req.session.user) {
        res.clearCookie('user_sid');        
    }
    next();
});


// middleware function to check for logged-in users
var sessionChecker = (req, res, next) => {
    if (req.session.user && req.cookies.user_sid) {
        res.redirect('/Dashboard');
		
    } else {
        next();
    }    
};


//URL Of MongoDB Server.
const url = 'mongodb+srv://testright:Triangle@3@cluster0-grnvl.mongodb.net/test?retryWrites=true';

//Mongo Client Variable
const MongoClient = require('mongodb').MongoClient;
//const uri = "mongodb+srv://testright:<password>@cluster0-grnvl.mongodb.net/test?retryWrites=true";

//Database Name.
const dbName = 'TestRight';

app.get('/', sessionChecker, (req, res) => {
	res.render('homepage');
});
app.get('/login', sessionChecker, (req, res) => {
	res.render('login');
});

app.get('/register', sessionChecker,(req,res)=>{
	res.render('register');
});

app.get('/RegisterExaminer',(req,res)=>{
	res.render('register');
});
app.get('/TestCreate',(req,res)=>{
	if (req.session.user && req.cookies.user_sid) {
		res.render('testcreation_step1');
	}
	else
	{
		 res.redirect('/login');
	}
});
app.get('/AddQuestions',(req,res)=>{
	if (req.session.user && req.cookies.user_sid && req.cookies["id"]) {
		MongoClient.connect(url,{ useNewUrlParser: true },function(err,client){
		console.log("Inside Add Questions \nAdding Data to :- \n");
		
		const db = client.db(dbName);
		const collection = db.collection('tests');
		var mongo = require('mongodb');
		var id=new mongo.ObjectID(req.cookies["id"]);
		collection.find({_id:id}).toArray(function(err,docs)
		{
			console.log(docs);
			res.render('testcreation_step2',{data:docs});
		
		});	
		client.close();
	});
		
	}
	else
	{
		 res.redirect('/Dashboard');
	}
	
	
});
app.get('/Dashboard',(req,res)=>{
	if (req.session.user && req.cookies.user_sid) {
		res.clearCookie("id");
		res.render('dashboard');
	}
	else
	{
		 res.redirect('/login');
	}
});


// route for user logout
app.get('/logout', (req, res) => {
    if (req.session.user && req.cookies.user_sid) {
        res.clearCookie('user_sid');
        res.redirect('/');
    } else {
        res.redirect('/login');
    }
});



app.post('/RegisterExaminer',(req,res)=>{
	MongoClient.connect(url,{ useNewUrlParser: true },function(err,client){
		console.log("Registration of Examiner...");
		
		const db = client.db(dbName);
		const collection = db.collection('Examiners');
		collection.insertOne(
			{
				Name: req.param('ExmUsrName', null),
				Email : req.param('ExmUsrEmail', null),
				Password : req.param('ExmUsrPass', null),
				/*EmailId : req.param('TxtEmailId', null),
				Password : req.param('TxtPassword', null)*/
			},function(err,result){
				
				res.redirect('/login');
		});
		
	
	});

});

app.post('/TestCreate',(req,res)=>{
	MongoClient.connect(url,{ useNewUrlParser: true },function(err,client){
		console.log("Inside test Creation...");
		
		const db = client.db(dbName);
		const collection = db.collection('tests');
		collection.insertOne(
			{
				//Name: req.param('ExmUsrName', null),
				Examiner_id:req.session.user.Email,
				Test_title:req.param('TestTitle', null),
				Subject:req.param('TestSubject', null),
				Date:req.param('TestDate', null),
				Time:req.param('TestTime', null),
				Duration:req.param('TestDuration', null),
				tags:req.param('TestTags', null),
				private:req.param('TestType', null)
				/*"questions":{
					"question":{"value":"What is Html ?",
					"options":{
						"A":{
							"value":"Something",
							"correct":false
							},
						"B":{
							"value":"More",
							"correct":true
							}
						}
					}
				}*/
					
				
			},function(err,result){
				//console.log(result.insertedId);
				res.cookie("id",result.insertedId);
				res.redirect('/AddQuestions');
		});
		collection.find({}).toArray(function(err,docs)
		{
			//console.log(docs);
		});
	
	});

});


app.get('/LoginExaminer', sessionChecker,(req,res)=>{
	res.clearCookie("id");
	res.render('login');
});

app.post('/LoginExaminer',(req,res)=>{
	MongoClient.connect(url,{ useNewUrlParser: true },function(err,client){
		console.log("Trying to Login..");
		
		const db = client.db(dbName);
		
		db.collection('Examiners').findOne({
				$and:
				[	
					{Email : req.param('ExmUsrEmail', null)},
					{Password : req.param('ExmUsrPass', null)}
				]
				
			}, function(err, user) {
             if(user ===null){
               res.end("Login invalid");
			   console.log("Login Invaild");
            } else {
            
			req.session.user = user;
			console.log(req.session.user);
            res.redirect('/Dashboard');
          }
	});
			
	});

});
	
app.get('/RegisterStudent',(req,res)=>{
	res.render('register');
});

app.post('/RegisterStudent',(req,res)=>{
	MongoClient.connect(url,{ useNewUrlParser: true },function(err,client){
		console.log("Inside Registration of Student..");
		
		const db = client.db(dbName);
		const collection = db.collection('Students');
		collection.insertOne(
			{
				Name: req.param('StdUsrName', null),
				Email : req.param('StdUsrEmail', null),
				Password : req.param('StdUsrPass', null),
				
			},function(err,result){
				res.redirect('/login');
		});
		
	
	});

});
app.get('/LoginStudent',(req,res)=>{
	res.render('login');
});

app.post('/LoginStudent',(req,res)=>{
	MongoClient.connect(url,{ useNewUrlParser: true },function(err,client){
		console.log("Trying to Login...");
		
		const db = client.db(dbName);
		
		db.collection('Students').findOne({
				$and:
				[	
					{Email : req.param('StdUsrEmail', null)},
					{Password : req.param('StdUsrPass', null)}
				]
				
			}, function(err, user) {
             if(user ===null){
               res.end("Login invalid");
			   console.log("Login Invaild");
            } else {
            console.log(user);
            res.end("Login valid");
          }
	});
			
	});

});


app.get('/MemberRecordsExaminers',(req,res)=>{
	MongoClient.connect(url,{ useNewUrlParser: true },function(err,client){
		console.log("Printing Data of Member Records Examiners");
		
		const db = client.db(dbName);
		const collection = db.collection('Examiners');
		collection.find({}).toArray(function(err,docs)
		{
			console.log(docs);
			res.render('MemberRecordsExaminers',{data:docs});
		
		});	
		client.close();
	});
})


app.get('/MemberRecordsStudents',(req,res)=>{
	MongoClient.connect(url,{ useNewUrlParser: true },function(err,client){
		console.log("Printing Data of Member Records Students");
		
		const db = client.db(dbName);
		const collection = db.collection('Students');
		collection.find({}).toArray(function(err,docs)
		{
			console.log(docs);
			res.render('MemberRecordsStudents',{data:docs});
		
		});	
		client.close();
	});
})

//Showing Data on Terminal...
app.get('/showtests',(req,res)=>{
	MongoClient.connect(url,{ useNewUrlParser: true },function(err,client){
		console.log("Showing tests");
		
		const db = client.db(dbName);
		const collection = db.collection('tests');
		collection.find({}).toArray(function(err,docs)
		{
			console.log(docs);
		});	
		client.close();
	});
})



app.post('/AddQuestions',(req,res)=>{
	
	MongoClient.connect(url,{ useNewUrlParser: true },function(err,client){
		console.log("Inside Adding Questions");
		//var yo=
		//console.log(req.param('question_0', null));
		const db = client.db(dbName);
		const collection = db.collection('tests');
		var mongo = require('mongodb');
		var id=new mongo.ObjectID(req.cookies["id"]);
		var qns=parseInt(req.query.qns);
		//var qns=2;
		console.log(qns);
		for(var i=0;i<=qns;i++)
		{
			console.log("Loop Started");
			
			var select =req.param('select_'+i, null);
			console.log("Adding Question with options "+select);
			if(select==null)
			{
				continue;
			}
			else if(select==2)
			{
				
				collection.updateOne({_id:id}, {$push:{
					
					questions:
					{
						question:
						{
							value:req.param('question_'+i, null),
							options:
							{
								A:
								{
									value:req.param('option_1_'+i, null),
									correct:req.param('ACorrect_'+i, null)
								},
								B:
								{
									value:req.param('option_2_'+i, null),
									correct:req.param('BCorrect_'+i, null)
								}
							}
						}
					}
					
				}});
			}
			else
			{
				collection.updateOne({_id:id}, {$push:{
					
					questions:
					{
						question:
						{
							value:req.param('question_'+i, null),
							options:
							{
								A:
								{
									value:req.param('option_1_'+i, null),
									correct:req.param('ACorrect_'+i, null)
								},
								B:
								{
									value:req.param('option_2_'+i, null),
									correct:req.param('BCorrect_'+i, null)
								},
								C:
								{
									value:req.param('option_3_'+i, null),
									correct:req.param('CCorrect_'+i, null)
								},
								D:
								{
									value:req.param('option_4_'+i, null),
									correct:req.param('DCorrect_'+i, null)
								}
							}
						}
					}

				}});
			}
		}
		
		console.log("Questions Added redirected to Dashboard !!");
		res.clearCookie("id");
		res.redirect('/Dashboard');
		
		
		client.close();
	});
	
});




//Httpserver Port Number 3000.

app.listen(process.env.PORT || 3000, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});

//Set The File Type To App As EJS.
app.set('view engine', 'ejs');
