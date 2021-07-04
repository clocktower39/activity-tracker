const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const http = require('http').Server(app);
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
require('dotenv').config();

const dbUrl = process.env.DBURL;

let PORT = process.env.PORT;
if( PORT == null || PORT == ""){
    PORT = 8000;
}

app.use(cors());
app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
mongoose.set('useFindAndModify', false);

mongoose.connect(dbUrl, 
    {
        useUnifiedTopology: true,
        useNewUrlParser: true,
        useCreateIndex: true
    } , (err) => {
    console.log('mongo db connection', err)
})

let Goal = mongoose.model('Message', {
    task: String,
    interval: String,
    targetPerDuration: Number,
    achieved: Number,
    category: String,
});

app.get('/', (req,res) => {
    Goal.find({}, (err,messages)=>{
        res.json(messages)
        console.log(req.socket.remoteAddress);
    })
})

app.post('/addGoal', (req, res) => {
    let goal = new Goal(req.body);

    let saveGoal = () => {
        goal.save((err)=>{
            if(err){
                sendStatus(500);
            }
            else {
                res.sendStatus(200);
            }
        });
    }
})

let server = http.listen(PORT, ()=> {
    console.log(`Server is listening on port ${server.address().port}`);
});