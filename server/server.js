const express = require('express')
const cors = require('cors') 

const userRouter = require("./routes/user")

const app = express()
app.use(cors({
    origin : "*",
    credentials : true
}))
app.use(express.json());

// router 영역
app.use("/user", userRouter);

app.listen(3020, ()=>{
    console.log("server start!");
})