const express = require("express");
const app = express();
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require('bcryptjs');

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");

var urlencodedParser = bodyParser.urlencoded({ extended: false }) 
app.use(bodyParser.urlencoded({ extended: false })); 



const jwt = require('jsonwebtoken');

app.use(cors({
    origin: "http://localhost:3000"
}));
app.use(bodyParser.json());


const saltRound = 10;




const db = mysql.createConnection({
    user: "root",
    host: "localhost",
    password: "password",
    database: "loginsystem"
 });




app.post('/register', (req, res)=> {
    const username = req.body.usernameReg;
    const password = req.body.passwordReg;
    console.log(username)
    bcrypt.hash(password,saltRound, (err, hash) => {
        if (err) {
            console.log("hiii",err)
        }
        db.query( 
            'INSERT INTO users (username, password) VALUES (?,?);',
            [username, hash], 
            (err, result)=> {
                if(err){
                    console.log("hmmmm",err)
                }
                else{
                    console.log("result",result)
                    res.send(result);
                }
                
            }
        );
    });
});


const verifyJWT = (req, res, next) => {
    const token = req.headers["x-access-token"];
    if (!token) {
        res.send("We need a token, please give it to us next time");
    } else {
        jwt.verify(token, "jwtSecret", (err, decoded) => {
            if (err) {
                console.log(err);
                res.json({ auth: false, message: "you are failed to authenticate"});
            } else {
                req.userId = decoded.id;
                next();
            }
        });
    }
};







app.get('/isUserAuth', verifyJWT , (req, res) => {
    res.send("You are authenticated Congrats:")
})


app.get("/login", (req, res) => {
    console.log(req.session)
    if (req.session.user) {
      res.send({ loggedIn: true, user: req.session.user });
    } else {
      res.send({ loggedIn: false });
    }
  });




app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    
    db.query(
        'SELECT * FROM users WHERE username = ?;',
        [username], 
        (err, result)=> {
            var logusername = result[0].username
            var logpassword = result[0].password
            console.log(bcrypt.compareSync(password,logpassword))
            // if (err) {
            //     res.send({err: err});
            // }
            if (username == logusername && bcrypt.compareSync(password,logpassword)) {
                        id = result[0].id
                        const token = jwt.sign({id}, "jwtSecret", {expiresIn: 300,})
                        // req.session.user = result;
                        // res.json({auth:true, token:token, result:result})
                        res.status(200).send({auth:true,token:token})
                        console.log(token)
                        // res.send(result)
                        
                        // res.json({auth: true, token: token, result: result});
                    } else{
                        res.status(500).send({auth:false,error:"login failed"});
                        console.log("errrrrooorrr",error)
                        // res.json({auth: false, message: "Wrong username password"}); 
                    }
                }
            );
    }
)        



app.post('/create', urlencodedParser,(req,res)=>{
    console.log(req.body.eventname)
    // console.clear()
    // console.log(req.body.name)
    const event_name=req.body.eventname;
    const event_description=req.body.eventdescription;
    const event_date=req.body.eventdate;
  
   let query   = `INSERT INTO eventlist (eventname, eventdescription, eventdate) VALUES ("${event_name}", "${event_description}", "${event_date}")`;
    db.query(query,(err,result)=>{
      if(err) throw err
      res.json(result)
    })
  })




  app.get('/dashboard',(req,res)=>{
    db.query('select * from eventlist;',(err,result)=>{
        res.json(result)
    })
          })

          


app.delete('/delete/:id',(req,res)=>{
    const deletId=req.params.id;
  
        db.query("delete from eventlist where id=?;",deletId,(err,result)=>{
            if(err){
                console.log(err)}
                else{
                    res.send("DELETED")}
                    console.log(result)
            })
          //   res.json(result)
    })
  





    app.put('/update/:id',urlencodedParser,(req,res)=>{

        const upId=req.params.id;
        // console.log(req.body.name)
        let event_name=req.body.eventname;
        const event_description=req.body.eventdescription;
        const event_date=req.body.eventdate;
       

        db.query("UPDATE eventlist SET ? WHERE id=?;",[{eventname:event_name,eventdescription:event_description,
            eventdate:event_date},upId],(err,result)=>{
            if(err){
                console.log(err)}
                else{
                    res.send("updated")}
                    console.log(result)
        })
    })




    app.get('/getevent/:id',(req,res)=>{
        db.query('select * from eventlist WHERE id=?',[req.params.id],(err,result)=>{
            res.json(result)
        })
              })

 







app.use(express.json());

app.use(
    cors({
    origin: ["http://localhost:3000","http://localhost:3001","http://localhost:3002"],
    methods: ["GET", "POST"],
    credentials: true,
    })
);

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

app.use (
    session ({
        key: "userId",
        secret: "subscribe",
        resave: false,
        saveUninitialized: false,
        cookie: {
            expires: 60 * 60 * 24,
        },
    })
);

















app.listen(3001, () => {
   console.log("running server");
});