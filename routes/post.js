var express = require('express');
var router = express.Router();
var decode = require('../middleware/token');
const db = require('../secret/module');

const upload = require('../middleware/fileload');

router.post('/',decode,upload.array('attachment'),(req,res,next)=>{
    const insertQ= ()=>{
        db.beginTransaction();
        const promise = new Promise((resolve,reject)=>{
            var arr=[req.token.sub,req.body.city,req.body.county,req.body.aptname,'pending',req.body.context,req.body.type,req.body.price,req.body.address];
            var sql='INSERT INTO Post ('
            if(req.token.type=="broker"){
                sql+="BrokerID ";
                arr[4]="uploaded";
            }
            else
                sql+="UserID ";
            sql+=",City,County, AptName, State,Context, Type, Price,Address";
            if(req.body.type=="월세"){
                sql+=",MonthlyPrice) Values(?,?,?,?,?,?,?,?,?,?)";
                arr.push(req.body.monthlyprice);
            }
            else{ 
                sql+=") Values(?,?,?,?,?,?,?,?,?)"
            }    
            db.query(sql,arr,(err,result)=>{
                if(err) reject(err);
                else resolve(result.insertId);
            })
        })
        return promise;
    }
    const picturequery = (inserted)=>{
        const promise = new Promise((resolve,reject)=>{
            for(var i=0;i<req.files.length;i++){
                console.log([inserted]);
                db.query('INSERT INTO Image (PostID, URL) VALUES(?,?)',
                [inserted,"static/post/"+req.files[i].filename],(err,result)=>{
                    if(err)reject(err);
                })
            }
            resolve();
        })
        return promise;
    };
    const respond = ()=>{
        db.commit();
        res.status(200).json({});
    }
    const error =(err)=>{
        db.rollback();
        res.status(500).json(err);
    }

    insertQ()
    .then(picturequery)
    .then(respond)
    .catch(error);
})


router.get('/user',decode,(req,res,nex)=>{
    var c=db.query(`SELECT Post.PostID, Price, Address, PhoneNumber,Type,AptName,
    group_concat(URL ORDER BY ImageID)AS URL
    FROM Post LEFT JOIN Image ON Post.PostID = Image.PostID
    LEFT JOIN Broker ON Post.brokerID = Broker.ID
    WHERE state = "uploaded"
    AND Post.City=? AND Post.County=?
    GROUP BY Post.PostID 
    `,[req.query.city,req.query.county],(err,result)=>{
        console.log(c.sql);
        for(var x in result){
            if(result[x].URL!=null)
                result[x].URL=result[x].URL.split(',')[0];
        }
        res.json(result);
    })
})

router.get('/broker',decode,(req,res,nex)=>{
    var c=db.query(`SELECT Post.PostID, Price, Address, PhoneNumber,Type,AptName,
    group_concat(URL ORDER BY ImageID)AS URL
    FROM Post LEFT JOIN Image ON Post.PostID = Image.PostID
    LEFT JOIN Broker ON Post.brokerID = Broker.ID
    WHERE state = "pending" AND brokerID IS NULL
    AND Post.City=? AND Post.County=?
    GROUP BY Post.PostID 
    `,[req.query.city,req.query.county],(err,result)=>{
        console.log(c.sql);
        for(var x in result){
            if(result[x].URL!=null)
                result[x].URL=result[x].URL.split(',')[0];
        }
        res.json(result);
    })
})

router.get('/user/reservated',decode,(req,res,nex)=>{
    var c=db.query(`SELECT Post.PostID, Price,  Address, PhoneNumber,Type,AptName,
    group_concat(URL ORDER BY ImageID)AS URL
    FROM Post LEFT JOIN Image ON Post.PostID = Image.PostID
    LEFT JOIN Broker ON Post.brokerID = Broker.ID
    WHERE state = "reservated" AND ReservedUserID = ?
    GROUP BY Post.PostID 
    `,[req.token.sub],(err,result)=>{
        console.log(c.sql);
        for(var x in result){
            if(result[x].URL!=null)
                result[x].URL=result[x].URL.split(',')[0];
        }
        res.json(result);
    })
})

router.get('/broker/reservated',decode,(req,res,nex)=>{
    var c=db.query(`SELECT Post.PostID, Price,  Address, PhoneNumber,Type,AptName,
    group_concat(URL ORDER BY ImageID)AS URL
    FROM Post LEFT JOIN Image ON Post.PostID = Image.PostID
    LEFT JOIN Broker ON Post.brokerID = Broker.ID
    WHERE state = "reservated" AND brokerID =?
    GROUP BY Post.PostID 
    `,[req.token.sub],(err,result)=>{
        console.log(c.sql);
        for(var x in result){
            if(result[x].URL!=null)
                result[x].URL=result[x].URL.split(',')[0];
        }
        res.json(result);
    })
})

router.get('/:postid',decode,(req,res,next)=>{
    const searchPost = ()=>{
        const promise = new Promise((resolve,reject)=>{
            db.query(`SELECT UserID, brokerID, City, County, Context, AptName, State, Type, Price,Address, GROUP_CONCAT(URL ORDER BY ImageID)AS URL
            FROM Post LEFT JOIN Image ON Post.PostID = Image.PostID
            WHERE Post.postid = ?
            GROUP BY Post.PostID
            `,[parseInt(req.params.postid)],(err,result)=>{
                if(err)reject(err);
                if(result==undefined) reject(null);
                else resolve(result);
            })
        })
        return promise;
    }
   
    const substr = (result)=>{
        const promise = new Promise((resolve,reject)=>{
            result[0].URL=result[0].URL.split(',');
            resolve(result[0]);
        })
        return promise;
    }
    
    const respond = (result)=>{
        res.status(200).json(result);
    }
    const error = (error)=>{
        res.status(400).json({error});
    }
    searchPost()
    .then(substr)
    .then(respond)
    .catch(error);
})

router.put('/:postid/reserve',decode,(req,res,next)=>{
    db.query('Update Post SET ReservedUserID = ? ,State = "reservated" WHERE PostID = ?',[req.token.sub,req.params.postid],(err,result)=>{
        if(err)res.status(400).json({err});
        else res.status(200).json({});
    })
})

router.put('/:postid/:price',decode,(req,res,next)=>{
    db.query('Update Post SET brokerID = ? ,State = "pending" ,Price = ? WHERE PostID = ?',
    [req.token.sub,parseInt(req.params.price),parseInt(req.params.postid)],(err,result)=>{
        if(err)res.status(400).json({err});
        else res.status(200).json({});
    })
})

module.exports=router;