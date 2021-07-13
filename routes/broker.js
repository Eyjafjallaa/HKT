var express = require('express');
var router = express.Router();
const db = require('../secret/module');
var decode = require('../middleware/token');
const jwt = require('jsonwebtoken');
const secret = require('../secret/primary');

router.post('/login',(req,res,next)=>{
    db.query(`SELECT PW FROM Broker WHERE ID=?`, [req.body.id], (err, result) => {
        //console.log(result)
        if (result[0] == undefined) {
        res.status(401).json({});
        return;
      }
      if (req.body.pw == result[0].PW) {
        var user = {
          sub: req.body.id,
          iat: new Date().getTime() / 1000
        };
        var token = jwt.sign(user, secret, {
          expiresIn: "32H"
        })
        res.status(200).json({
          logintoken: token,
        });
      }
      else {
        res.status(401).json({});
      }
    })
});

router.post('/signup',(req,res,next)=>{
    db.query('insert INTO Broker (id,pw,phonenumber,city,county,name) VALUES(?,?,?,?,?,?)',
    [req.body.id,req.body.pw,req.body.phonenumber,req.body.city,req.body.county,req.body.name],(err,result)=>{
        if(err){
            res.status(400).json({err});
            return;
        }
        res.status(200).json({});
    })
});

router.post('/idcheck',(req,res,next)=>{
    db.query('SELECT id FROM Broker WHERE id = ?',[req.body.id],(err,result)=>{
        if(err){
            res.status(400).json({err});
        }
        if(result[0]==undefined){
            res.status(200).json({});
        }
        else{
            res.status(401).json({});
        }
    })
});

router.get('/autologin',decode,(req,res,next)=>{
    db.query(`SELECT id FROM Broker WHERE id = ?`,[req.token.sub],(err,result)=>{
        if(err)res.status(400).json({err});
        if(result[0]==undefined)res.status(400).json({"no":"no"});
        else res.status(200).json({});
    })
});

module.exports = router;