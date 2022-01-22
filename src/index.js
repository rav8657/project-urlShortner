const express = require('express');
var bodyParser = require('body-parser');

const route = require('./routes/route.js');

const app = express();

app.use(bodyParser.json());


const mongoose = require("mongoose")

app.use('/', route);

mongoose.connect("mongodb+srv://monty-python:SnYUEY4giV9rekw@functionup-backend-coho.0zpfv.mongodb.net/Sourav_db?retryWrites=true&w=majority" )
    .then(() => console.log('mongodb Rock n Roll on 27017'))
    .catch(err => console.log(err))


app.listen(3000, function(){
    console.log('Express is running on port 3000');
})