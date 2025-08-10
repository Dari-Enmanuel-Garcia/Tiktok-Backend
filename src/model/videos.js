const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate-v2");


const videoSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true
    },
    video_url: {
        type: String,
        required: true
    },
    title: {
        type: String,
        default: "Video title"
    },
    description: {
        type: String,
        default: "Video description"
    },
    likes: [{  
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    }],
    views: [{  
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    }],

    created_at: {
        type: Date,
        default: Date.now
    },
})

videoSchema.plugin(mongoosePaginate)

module.exports = mongoose.model("videos", videoSchema);