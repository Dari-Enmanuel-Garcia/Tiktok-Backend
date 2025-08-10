const zod = require("zod");

const videoValidationSchema = zod.object({
    videoTitle :zod.string().min(8).max(100).optional(),
    videoSearchTitle :zod.string().max(100).optional(),
    videoId:zod.string().min(20).max(25).optional(),
    videoDescription:zod.string().min(8).max(100).optional(),
    userId:zod.string().min(20).max(25).optional()
})

module.exports = videoValidationSchema
