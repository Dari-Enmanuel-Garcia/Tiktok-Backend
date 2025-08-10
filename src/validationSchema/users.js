const zod = require("zod");

const userValidationSchema = zod.object({
    userEmail:zod.string().min(8).max(100).email().optional(),
    userPassword:zod.string().min(8).max(32).optional(),
    userUsername:zod.string().min(6).max(32).optional(),
    userName:zod.string().min(6).max(40).optional(),
    userToFollow:zod.string().min(6).max(40).optional(),
    userToUnFollow:zod.string().min(6).max(40).optional(),
    userBio:zod.string().min(5).max(100).optional()
})

module.exports = userValidationSchema