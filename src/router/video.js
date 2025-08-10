const router = require("express").Router();
const videoController = require("../controllers/video");
const verifyToken = require("../middlewares/verifyToken")


//POST
router.post("/videos/uploadVideo",verifyToken, videoController.uploadVideo);
router.post("/videos/likeVideo",verifyToken, videoController.likeVideo);
router.post("/videos/unlikeVideo",verifyToken, videoController.unlikeVideo);
router.post("/videos/addViewToVideo",verifyToken, videoController.addViewToVideo);
router.post("/videos/updateVideoData",verifyToken, videoController.updateVideoData);
router.post("/videos/searchVideo",verifyToken, videoController.searchVideo);
//DELETE
router.delete("/videos/deleteVideo",verifyToken, videoController.deleteVideo);
//GET
router.get("/videos/getAllVideos/:page",verifyToken, videoController.getAllVideos);
router.get("/videos/getAllUserVideos/:userId/:page",verifyToken, videoController.getAllUserVideos);
router.get("/videos/getSpecificVideo/:videoId",verifyToken, videoController.getSpecificVideo);
router.get("/videos/getRandomVideo",verifyToken, videoController.getRandomVideo);






module.exports = router;
