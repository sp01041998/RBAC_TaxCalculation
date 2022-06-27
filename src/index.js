
const route= require("./routes/route")
const bodyParser = require("body-parser")
const express = require("express")
const { default: mongoose } = require("mongoose")

const app = express()


app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))


app.use("/", route)

mongoose.connect("mongodb+srv://sp01041998:71HOQkRVAWXnVxw0@cluster0.deqvc.mongodb.net/taxCal-roleBased")
                   .then(() => console.log("mongodB is connected"))
                   .catch((err) => console.log(err))


app.listen(process.env.PORT || 3000, function() {
    console.log("express app running on the port" + (process.env.port || 3000))
})


