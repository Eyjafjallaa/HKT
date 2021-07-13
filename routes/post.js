var express = require('express');
var router = express.Router();
var decode = require('../middleware/token');
const db = require('../secret/module');
const jwt = require('jsonwebtoken');
const secret = require('../secret/primary');

router.post('',(req,res,next)=>{

})

module.exports=router;