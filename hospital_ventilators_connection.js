var express=require('express');
var app=express();

//bodyparser
const bodyParser=require('body-parser');
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

//for mongodb
const MongoClient=require('mongodb').MongoClient;

//connecting server file for awt
let server=require('./server');
let config=require('./config');
let middleware=require('./middleware');
const response=require('express');

//database connection
const url='mongodb://127.0.0.1:27017';
const dbName='hospital_ventilators';
let db
MongoClient.connect(url,{ useUnifiedTopology: true },(err,client)=>{
    if(err) return console.log(err);
    db=client.db(dbName);
    console.log(`Connected Database:${url}`);
    console.log(`Database:${dbName}`);
});

//Fetching hospital details
app.get("/hospitalsdetails",(req,res)=>{
    console.log("Fetching data from hospital collection");
    var data = db.collection('hospital').find().toArray()
         .then(result => res.send(result));
});

//Fetching ventilators details
app.get("/ventilatordetails",(req,res)=>{
    console.log("Fetching data from ventilators collection");
    var data = db.collection('ventilator').find().toArray()
         .then(result => res.send(result));
});

//search ventilators by status
app.post('/searchventilatorbystatus',middleware.checkToken,(req,res)=>{
    var status=req.body.Status;
    console.log("searching ventilators using status : "+status);
    var ventilatordetails=db.collection('ventilator').find({"Status":status}).toArray().then(result=>{
        if(result.length!=0){
            res.json(result);
        }
        else{
            res.send("Ventilators of given status not found");
            console.log("Ventilators of given status not found");
        }
    });        
});

//search ventilators by hospital name
app.post('/searchventilatorbyname',middleware.checkToken,(req,res)=>{
    var name=req.query.Name;
    console.log("searching ventilators by hospital name : "+name);
    var ventilatordetails=db.collection('ventilator').find({"Name":new RegExp(name,'i')}).toArray().then(result=>{
        if(result.length!=0){
            res.json(result);
        }
        else{
            res.send("Hospital name not found");
            console.log("Hospital name not found");
        }
    });              
});

//search hospital by name
app.post('/searchhospitalbyname',middleware.checkToken,(req,res)=>{
    var name=req.query.Name;
    console.log("searching hospital by hospital name : "+name);
    var hospitaldetails=db.collection('hospital').find({'Name':new RegExp(name,'i')}).toArray().then(result=>{
        if(result.length!=0){
            res.json(result);
        }
        else{
            res.send("Hospital name not found");
            console.log("Hospital name not found");
        }
    });        
});

//update ventilator details
app.put('/updateventilator',middleware.checkToken,(req,res)=>{
    var vid = {"Ventilator_id":req.query.Ventilator_id};
    var data = db.collection('ventilator').find(vid).toArray()
        .then(result=>{
        if(result.length!=0)
        {
            console.log("updating status of:",vid);
            var doc ={$set:{"Status": req.body.Status}};
            db.collection("ventilator").updateOne(vid,doc,function(err,result){
                res.send("1 document updated");
                if(err)throw err;
            });
        }
            
        else
        {
            console.log("ventilator of given id is not found");
            res.send("invalid ventilator id");
        }
        
    });
    
});

//add ventilator
app.post('/addventilator',middleware.checkToken,(req,res)=>{
    const hid = req.body.Hospital_id;
    const vid = req.body.Ventilator_id;
    const sta = req.body.Status;
    const name = req.body.Name;

    console.log("adding ventilators details");

    var doc ={"Hospital_id":hid,"Ventilator_id":vid,"Status":sta,"Name":name };

    db.collection("ventilator").insertOne(doc,function(err,result){
        res.json('item inserted');
    });
});

//delete ventilator by ventilatorid
app.delete('/delete',middleware.checkToken,(req,res)=>{
    var myquery=req.query.Ventilator_id;
    
    var myquery1={"Ventilator_id":myquery};
    db.collection('ventilator').find(myquery1).toArray()
    .then(result=>{if(result.length==0)
                        res.send("ventilator of given id not found");
                    else{console.log("Deleting ventilator of id : "+myquery);
                        db.collection('ventilator').deleteOne(myquery1,function(err,obj){
                        if(err)throw err;
                        res.json("1 document deleted");
                        });
                    }
                });
    
});         
app.listen(3001);