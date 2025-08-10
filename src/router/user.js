const router = require("express").Router();
const userController = require("../controllers/user");
const verifyToken = require("../middlewares/verifyToken")

//POST
router.post("/users/createUser", userController.createUser);
router.post("/users/loginUser", userController.loginUser);
router.post("/users/getUserDataWithEmail", userController.getUserDataWithEmail);
router.post("/users/followUser",verifyToken, userController.followUser);
router.post("/users/unFollowUser",verifyToken, userController.unfollowUser);
router.post("/users/verifyUser",verifyToken, userController.verifyUser);
//PUT
router.put("/users/configUser",verifyToken, userController.configUser); 
//Get
router.get("/users/getUserDataWithName/:userName", userController.getUserDataWithName);
router.get("/users/searchUsers/:userName/:page", userController.searchUsers);



module.exports = router;
