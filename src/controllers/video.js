const {initializeApp} = require("firebase/app")
const {getStorage, ref, uploadBytes, getDownloadURL, deleteObject} = require("firebase/storage")
const videoValidationSchema = require("../validationSchema/videos")
const userModel = require("../model/users")
const videoModel = require("../model/videos")
const jwt = require("jsonwebtoken")
const fs = require('fs').promises;

const {
    SECRET,
    FIREBASE_APIKEY,
    FIREBASE_AUTHDOMAIN,
    FIREBASE_DATABASEURL,
    FIREBASE_PROJECTID,
    FIREBASE_STORAGEBUCKET,
    FIREBASE_MESSAGINGSENDER,
    FIREBASE_APPID
} = process.env

const firebaseConfig = {
    apiKey: FIREBASE_APIKEY,
    authDomain: FIREBASE_AUTHDOMAIN,
    databaseURL: FIREBASE_DATABASEURL,
    projectId: FIREBASE_PROJECTID,
    storageBucket: FIREBASE_STORAGEBUCKET,
    messagingSenderId: FIREBASE_MESSAGINGSENDER,
    appId: FIREBASE_APPID
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

const videoController = {
    async uploadVideo(req, res) {
        const token = req.cookies.token
        const {videoDescription, videoTitle} = req.body

        if (!token) {
            return res.status(401).json({valid: false})
        }

        if (!videoDescription || !videoTitle) {
            return res.status(400).json({message: "Debes entregar datos!"})
        }

        const result = videoValidationSchema.safeParse(req.body)
        if (!result.success) {
            return res.status(400).json({message: "Datos invalidos"})
        }
        try {
            const validation = await jwt.verify(token, SECRET)


            const existUser = await userModel.findOne({email:validation.email})

            if(!existUser){
                return res.status(400).json({message:"Usuario no existe"})
            }

            if (!req.files ?. video) {
                return res.status(400).json({message: "Debes entregar el video"})
            }

            const videoToUpload = req.files.video
            const validTypes = ["video/mp4"]

            if (!videoToUpload.tempFilePath) {
                return res.status(400).json({ message: "No se encontro el video" });
            }
            
            const fileBuffer = await fs.readFile(videoToUpload.tempFilePath);

            if (!validTypes.includes(videoToUpload.mimetype)) {
                await fs.unlink(videoToUpload.tempFilePath).catch(console.error);
                return res.status(400).json({message: "Formato invalido"})
            }

            if (videoToUpload.size > 75 * 1024 * 1024) {
                await fs.unlink(videoToUpload.tempFilePath).catch(console.error);
                return res.status(400).json({message: "El video supera los 75 megabytes"});
            }
            
            const timestamp = Date.now();
            const combination = Math.floor(100000000000000 + Math.random() * 900000000000000)
            const videoName = `videos/${timestamp}_${combination}_${videoToUpload.name.replace(/\s+/g, '_')}`;
            const storageRef = ref(storage, videoName);
            await uploadBytes(storageRef, fileBuffer, {
                contentType: "video/mp4"
            });
            await fs.unlink(videoToUpload.tempFilePath).catch(console.error);
            const videoUrl = await getDownloadURL(storageRef);

            const newVideo = new videoModel({
                user:existUser._id,
                video_url:videoUrl,
                title:videoTitle,
                description:videoDescription
            })

            await newVideo.save()
            await userModel.updateOne({_id:existUser._id},{$addToSet:{saved_videos:newVideo._id}})
            return res.status(200).json({message: "Video subido correctamente", url:videoUrl})
        } catch (error) {
            if (req.files?.video?.tempFilePath) {
                await fs.unlink(req.files.video.tempFilePath).catch(console.error);
            }
            return res.status(500).json({message: "Error al subir el video"})
        }
    },

    async deleteVideo(req,res){
        const token = req.cookies.token
        const { videoId } = req.body

        if(!token){
            return res.status(401).json({valid:false})
        }

        if(!videoId){
            return res.status(400).json({message:"Debes entregar datos"})
        }

        const result = videoValidationSchema.safeParse(req.body)

        if(!result.success){
            return res.status(400).json({message:"Datos invalidos"})
        }
        try {
            const validation = await jwt.verify(token,SECRET)

            const existUser = await userModel.findOne({email:validation.email})

            if(!existUser){
                return res.status(400).json({message:"Usuario no existe"})
            }

            const existVideo = await videoModel.findOne({_id:videoId})

            if(!existVideo){
                return res.status(400).json({message:"El video no existe"})
            }

            if(!existUser.saved_videos?.includes(existVideo._id) && existVideo.user != existUser._id){
                return res.status(400).json({message:"El video no es propiedad del usuario"})
            }
            const fileRef = ref(storage, existVideo.video_url);
            await deleteObject(fileRef);
            await existUser.updateOne({$pull: { saved_videos: existVideo._id}})
            await existVideo.deleteOne()
            return res.status(200).json({message:"Video eliminado correctamente"})
        } catch (error) {
         console.log(error)
         return res.status(500).json({message:"Error al eliminar el video"})
        }
    },

    async getAllVideos(req,res){
        const token = req.cookies.token
        let { page = 1 } = req.params

        page = parseInt(page, 10)

        if(isNaN(page) || page < 1){
            page = 1
        }

        if(!token){
            return res.status(401).json({valid:false})
        }

        try{
            const result = await jwt.verify(token,SECRET)

            const options = {
                page: page,
                limit: 20,
                select: "_id user video_url title description likes views created_at",
                sort: { followers: -1 }
            };

            const allVideos = await videoModel.paginate({},options)
            if (allVideos.docs.length === 0) {
                return res.status(404).json({ message: "No se encontraron videos" });
            }
            return res.status(200).json({ videos: allVideos.docs, pagination: { currentPage: allVideos.page, totalPages: allVideos.totalPages, totalVideos: allVideos.totalDocs, hasNextPage: allVideos.hasNextPage}});
        }
        catch(error){
            console.log(error)
            return res.status(500).json({message:"Error interno al buscar los videos"})
        }
    },

    async getAllUserVideos(req,res){
        const token = req.cookies.token
        let { page = 1, userId } = req.params

        page = parseInt(page, 10)

        if(isNaN(page) || page < 1){
            page = 1
        }
        if(!token){
            return res.status(401).json({valid:false})
        }

        if(!userId){
            return res.status(401).json({message:"Debes entregar userId"})
        }

        const validation = await videoValidationSchema.safeParse(req.params)

        if(!validation.success){
            return res.status(400).json({message:"Datos invalidos"})
        }

        try{
            const result = await jwt.verify(token,SECRET)

            const options = {
                page: page,
                limit: 20,
                select: "_id user video_url title description likes views created_at",
                sort: { followers: -1 }
            };

            const allVideos = await videoModel.paginate({user:userId},options)
            if (allVideos.docs.length === 0) {
                return res.status(404).json({ message: "No se encontraron videos para este usuario" });
            }
            return res.status(200).json({ videos: allVideos.docs, pagination: { currentPage: allVideos.page, totalPages: allVideos.totalPages, totalVideos: allVideos.totalDocs, hasNextPage: allVideos.hasNextPage}});
        }
        catch(error){
            console.log(error)
            return res.status(500).json({message:"Error interno al buscar los videos"})
        }
    },

    async getSpecificVideo(req,res){
        const token = req.cookies.token
        let { videoId } = req.params
        videoId = videoId.toString()

        if(!token){
            return res.status(401).json({valid:false})
        }

        if(!videoId){
            return res.status(400).json({message:"Debes entregar videoId"})
        }

        const validation = await videoValidationSchema.safeParse(req.params)

        if(!validation.success){
            return res.status(400).json({message:"Datos invalidos"})
        }
        try {
            const result = await jwt.verify(token,SECRET)

            const specificVideo = await videoModel.findOne({_id:videoId})

            if(!specificVideo){
                return res.status(400).json({message:"Video no encontrado"})
            }

            return res.status(200).json(specificVideo)
        } catch (error) {
         return res.status(500).json({message:"Error al obtener un video especifico"})   
        }
    },

    async likeVideo(req,res){
        const token = req.cookies.token
        const { videoId } = req.body

        if(!token){
            return res.status(401).json({valid:false})
        }

        if(!videoId){
            return res.status(400).json({message:"Debes entregar datos"})
        }

        const result = videoValidationSchema.safeParse(req.body)

        if(!result.success){
            return res.status(400).json({message:"Datos invalidos"})
        }

        try {
            const validation = await jwt.verify(token,SECRET)

            const videoToLike = await videoModel.findOne({_id:videoId})

            if(!videoToLike){
                return res.status(404).json({message:"Video no existe"})
            }

            const userLiker = await userModel.findOne({_id:validation._id})

            if(!userLiker){
                return res.status(404).json({message:"Usuario no existe"})
            }

            if(videoToLike.likes.includes(userLiker._id)){
                return res.status(400).json({message:"Ya diste like a este video"})
            }
            await videoModel.updateOne({ _id: videoToLike._id },{ $addToSet: { likes: userLiker._id}})
            return res.status(200).json({message:"Like agregado correctamente"})
        } catch (error) {
            return res.status(500).json({message:"Error interno al dar like a un video"})
        }
    },

    async unlikeVideo(req,res){
        const token = req.cookies.token
        const { videoId } = req.body

        if(!token){
            return res.status(401).json({valid:false})
        }

        if(!videoId){
            return res.status(400).json({message:"Debes entregar datos"})
        }

        const result = videoValidationSchema.safeParse(req.body)

        if(!result.success){
            return res.status(400).json({message:"Datos invalidos"})
        }

        try {
            const validation = await jwt.verify(token,SECRET)

            const videoToUnlike = await videoModel.findOne({_id:videoId})

            if(!videoToUnlike){
                return res.status(400).json({message:"Video no existe"})
            }

            const userUnliker = await userModel.findOne({_id:validation._id})

            if(!userUnliker){
                return res.status(400).json({message:"Usuario no existe"})
            }

            if(!videoToUnlike.likes.includes(userUnliker._id)){
                return res.status(400).json({message:"No puedes quitar un like que nunca has dado"})
            }

            await videoModel.updateOne({ _id: videoToUnlike._id },{ $pull: { likes: userUnliker._id}})
            return res.status(200).json({message:"Like eliminado correctamente"})
        } catch (error) {
            return res.status(500).json({message:"Error interno al quitar un like a un video"})
        }
    },

    async addViewToVideo(req,res){
        const token = req.cookies.token
        const { videoId } = req.body

        if(!token){
            return res.status(401).json({valid:false})
        }

        if(!videoId){
            return res.status(400).json({message:"Debes entregar datos"})
        }

        const result = videoValidationSchema.safeParse(req.body)

        if(!result.success){
            return res.status(400).json({message:"Datos invalidos"})
        }

        try {
            const validation = await jwt.verify(token,SECRET)

            const videoToAddView = await videoModel.findOne({_id:videoId})

            if(!videoToAddView){
                return res.status(404).json({message:"Video no existe"})
            }

            const userViewer = await userModel.findOne({_id:validation._id})

            if(!userViewer){
                return res.status(404).json({message:"Usuario no existe"})
            }

            if(videoToAddView.views.includes(userViewer._id)){
                return res.status(400).json({message:"Ya viste este video"})
            }
            await videoModel.updateOne({ _id: videoToAddView._id },{ $addToSet: { views: userViewer._id}})
            return res.status(200).json({message:"View agregada correctamente"})
        } catch (error) {
            return res.status(500).json({message:"Error interno al agregar view a un video"})
        }
    },

    async updateVideoData(req,res){
        const { videoTitle,videoDescription, videoId} = req.body
        const token = req.cookies.token

        if(!token){
            return res.status(401).json({valid:false})
        }

        if(!videoId){
            return res.status(400).json({message:"Debes entregar videoId"})
        }

        const result = await videoValidationSchema.safeParse(req.body)

        if(!result.success){
            return res.status(400).json({message:"Datos invalidos"})
        }

        try {
            const validation = await jwt.verify(token,SECRET)

            const videoToUpdate = await videoModel.findOne({_id:videoId}).select("-__v -created_at")

            if(!videoToUpdate){
                return res.status(404).json({message:"Video no existe"})
            }

            const videoOwner = await userModel.findOne({_id:validation._id}).select("-__v -created_at")

            if(!videoOwner){
                return res.status(404).json({message:"Usuario no existe"})
            }

            if(videoOwner.saved_videos.includes(videoId)){
                return res.status(401).json({message:"Este video no te pertecene"})
            }

            if(videoTitle) videoToUpdate.title = videoTitle
            if(videoDescription) videoToUpdate.description = videoDescription

            await videoToUpdate.save()
            return res.status(200).json({message:"Video actualizado correctamente",video:videoToUpdate})
        } catch (error) {
            console.log(error)
            return res.status(500).json({message:"Error al actualizar datos del video"})
        }
    },

    async getRandomVideo(req,res){
        const token = req.cookies.token

        if(!token){
            return res.status(401).json({valid:false})
        }

        try{
            const validation = await jwt.verify(token,SECRET)

            const randomVideo = await videoModel.aggregate([{$sample:{ size: 1 }}])
            return res.status(200).json(randomVideo)
        }
        catch(error){
            return res.status(500).json({message:"Error al obtener video aleatorio"})
        }
    },

    async searchVideo(req,res){
        const token = req.cookies.token
        const { videoSearchTitle } = req.body
        if(!token){
            return res.status(401).json({valid:false})
        }

        if(!videoSearchTitle){
            return res.status(400).json({message:"Debes entregar un titulo para buscar videos relacionados"})
        }

        const result = await videoValidationSchema.safeParse(req.body)

        if(!result.success){
            return res.status(400).json({message:"Datos invalidos"})
        }

        try {
            const validation = await jwt.verify(token,SECRET)
            const results = await videoModel.find({title:{$regex: videoSearchTitle,$options: "i"}})
            return res.status(200).json(results)
        } catch (error) {
            console.log(error)
            return res.status(500).json({message:"Error interno al buscar un video"})
        }
    }
}

module.exports = videoController
