const mongoose = require("mongoose")
const mongoSchema = mongoose.Schema
const mongoosePaginate = require("mongoose-paginate-v2");


const userSchema = mongoSchema({
    email:{
        type:String,
        trim:true
    },
    password:{
        type:String
    },
    profile_photo:{
        type:String,
        default:"https://i.postimg.cc/zvfFVFnB/default-user.png"
    },
    username:{
        type:String,
        default:"newUser"
    },
    isVerified:{
        type:Boolean,
        default:false
    },
    verificationCode:{
        type:String
    },
    isConfig:{
        type:Boolean,
        default:false
    },

    name:{
        type:String,
    },
    bio:{
        type:String,
        default:"Your bio"
    },
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    }],
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    }],
    saved_videos: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'videos'
    }],
    created_at: {
        type: Date,
        default: Date.now
    }
})

userSchema.plugin(mongoosePaginate)

module.exports = mongoose.model("users",userSchema)