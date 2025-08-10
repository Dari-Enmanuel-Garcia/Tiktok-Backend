const commentSchema = new Schema({
    video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "videos",
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true
    },
    text: {
        type: String,
        maxlength: 500,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    }],

    dislikes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    }]
});

module.exports = mongoose.model("comments", commentSchema);
