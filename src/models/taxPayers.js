const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({

    title : { type : String,
        trim:true,
        required : [true, "title is missing"],
        enum : ["Mr", "Mrs", "Miss"]

    },
   
    name : {
        type : String,
        trim : true,
        required : [true, "userName is required"]
    },
    email : {
        type: String,
        trim:true,
        required: 'Email is required',
        unique: true,
        lowercase : true,
        validate : {
            validator : function(email) {
                return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)
            }, message: 'Please fill a  valid email address', isAsync: false
        }
    },

    phone : {
        type: String,
        trim: true,
        required :[true,'Phone no. is required'],
        unique : true,
        minLength : [10, 'minimum phone length should be 10'],
        maxLength : [10, 'maximum length should also be 10'],
        validate : {
            validator : function(phone) {
                return /^[0-9]{10}$/.test(phone)
            }, message : "phone number is not valid", isasync : false
        }
    },
    
    password : {
        type : String,
        required : [true, "password is missing"],
    },

    role : {
        type : String,
        default : "tax-payer",
        enum : ["tax-payer", "tax-accountant", "admin"]
    },
    taxStatus : {
        type : String,
        enum : ["NEW", "PAID", "DELAYED"],
        default : "PAID"

    },
    taxDue :{
        type : Number,
        default : 0
    },

    taxPaidTill_FY :{
        type : String
    }


    

   
}, {timestamps : true} )


module.exports=mongoose.model("user", userSchema)