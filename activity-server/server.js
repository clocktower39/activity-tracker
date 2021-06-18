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

app.get('/', (req,res) => {
    res.send(req.socket.remoteAddress);
})

let server = http.listen(PORT, ()=> {
    console.log(`Server is listening on port ${server.address().port}`);
});