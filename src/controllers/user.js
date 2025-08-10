//Modulos
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const cloudinary = require("cloudinary").v2
const fs = require("fs")
const mailSender = require("../services/mailSender")
const logger = require("../utils/logger")
//schemas
const userModel = require("../model/users")

//validation Schemas
const userValidationSchema = require("../validationSchema/users")

//Entorno / configuraciones
const { SECRET, CLOUD_NAME, API_KEY, API_SECRET } = process.env //Sacamos la data de las variables de entorno

cloudinary.config({ //Configuramos cloudinary con la data obtenida
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET
})

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
const userController ={
    async createUser(req,res){ //Tal cual el nombre, aqui crearemos al usuario
        const { userEmail, userPassword } = req.body
        //Validamos que nos hayan entregado datos necesarios, detenemos el flujo si no
    if (!userEmail || !userPassword) {
        return res.status(400).json({ message: "Debes entregar datos como userEmail, userPassword"})
    }

    try {
        const existUser = await userModel.findOne({email:userEmail}) //Cuestionamos la existencia del usuario en la db

        if(existUser){
            return res.status(409).json({message:"Email ya utilizado"}) //Puesto que si existe es porque ya esta registrado
        }
        const results = await userValidationSchema.safeParse(req.body) //Esto utiliza zod para validar los datos, por ejemplo el length de los mismos
        
        if(!results.success){ //Devolvemos datos invalidos en caso de que sean invalidos
            return res.status(400).json({message:"Datos invalidos"})
        }

        const hashPass= await bcrypt.hash(userPassword,10) //Hasheamos la password para mayor seguridad en los datos
        const verificationCode = await createCode()
        const newUser = new userModel({ // Y creamos una nueva instancia del userModel, necesaria para crear de 0 nuevos documentos
            email:userEmail,
            password:hashPass,
            verificationCode:verificationCode
        })

        await newUser.save() //con .save() lo introducimos a la base de datos, importante usar await para esperar a que el proceso termine
        await mailSender("TiktokCopy",`Tu codigo es: <b style="font-size: 28px;">${newUser.verificationCode}</b>`,newUser.email,"Codigo de verificacion!")
        logger.info(`Usuario creado: ${newUser.email}`)
        return res.status(201).json({ message: "Usuario creado" })
    } catch (error) {
        logger.error(`Error 500 al crear un usuario: ${error.message}`)
        return res.status(500).json({ message: "Error en el servidor al crear el usuario"})
    }   //Le hice format al documento con una extension rara y me desubico las llaves D: Ayudaaa de momento este documento quedara asi
    },

    async loginUser(req,res){
        const { userEmail, userPassword } = req.body

        if(!userEmail ||!userPassword){
            return res.status(400).json({message:"Debes entregar userEmail, userPassword"})
        }

        try{
            const results = await userValidationSchema.safeParse(req.body)
            if(!results.success){
                return res.status(400).json({message:"Datos invalidos"})
            }

            const existUser = await userModel.findOne({email:userEmail})

            if(!existUser){
                return res.status(404).json({message:"El usuario no esta registrado"})
            }

            const isPassword = await bcrypt.compare(userPassword, existUser.password)

            if(!isPassword){
                return res.status(401).json({message:"Las passwords no coinciden"})
            }
            const {SECRET} = process.env
            const user = {email:existUser.email, _id:existUser._id}
            const token = jwt.sign(user,SECRET,{expiresIn:"24h"})
            return res.status(202).cookie("token", token, { httpOnly: true, maxAge: 3600000, secure:true, sameSite:"None" }).json({message:"Credenciales correctas"})
        }
        catch(error){
            logger.error(`Error 500 al iniciar sesion en un usuario: ${error.message}`)
            return res.status(500).json({message:"Error interno al iniciar la sesion"})
        }
    },

    async verifyUser(req,res){
        const userCode = req.body.userCode
        
        if(!userCode){
            return res.status(400).json({message:"Debes entregar un codigo"})
        }
        
        try {
            const userData = req.user

            if(userData.isVerified === true){
                return res.status(401).json({message:"Ya estas verificado"})
            }

            if(userCode !== userData.verificationCode){
                return res.status(400).json({message:"Codigo no coincide"})
            }

            userData.isVerified = true
            await userData.save()
            return res.status(200).json({message:"Verificado correctamente"})
        } catch (error) {
            logger.error(`Error 500 al verificar usuario: ${error.message}`)
            return res.status(500).json({message:"Error en el servidor al verificar usuario"})
        }
    },

    async getUserDataWithEmail(req,res){
        const { userEmail } = req.body

        if(!userEmail){
            return res.status(400).json({message:"Debes entregar userEmail"})
        }

        const result = await userValidationSchema.safeParse(req.body)

        if(!result.success){
            return res.status(400).json({message:"Datos no validos"})
        }

        try {
            const existUser = await userModel.findOne({email:userEmail}).select("-password -__v -email")

            if(!existUser){
                return res.status(404).json({message:"Usuario no existe"})
            }
            return res.status(200).json({message:"Datos del usuarios obtenidos correctamente", allData:existUser})
        } catch (error) {
            logger.error(`Error 500 al obtener los datos de un usuario: ${error.message}`)
            return res.status(500).json({message:"Internal server error al obtener los datos"})
        }
    },
    async getUserDataWithName(req,res){
        let { userName } = req.params

        if(!userName.startsWith("@")){
            userName = `@${userName}`
        }

        if(!userName){
            return res.status(400).json({message:"Debes entregar userName"})
        }

        const result = await userValidationSchema.safeParse(req.params)

        if(!result.success){
            return res.status(400).json({message:"Datos no validos"})
        }

        try {
            const existUser = await userModel.findOne({name:userName.toLowerCase()}).select("-password -__v -email")

            if(!existUser){
                return res.status(404).json({message:"Usuario no existe"})
            }
            return res.status(200).json({message:"Datos del usuarios obtenidos correctamente", allData:existUser})
        } catch (error) {
            logger.error(`Error 500 al obtener los datos de un usuario: ${error.message}`)
            return res.status(500).json({message:"Internal server error al obtener los datos"})
        }
    },

    async configUser(req, res) {
        const { userUsername, userBio } = req.body
    
        if (!req.body) {
            return res.status(400).json({ message: "Debes entregar datos" })
        }
    
        try {
          const result = userValidationSchema.safeParse(req.body)

          if (!result.success){
            return res.status(400).json({ message: "Datos invalidos" })
          }
    
          const userToUpdate = req.user

          if(userToUpdate.isVerified === false){
            return res.status(401).json({message:"Necesitas verificarte para configurarte"})
          }
    
          if (req.files?.profileImage) {
            const image = req.files.profileImage
    
            const validTypes = ["image/jpeg", "image/png", "image/webp"]
            if (!validTypes.includes(image.mimetype)) {
              return res.status(400).json({ message: "Formato de imagen no valido" })
            }
            if (image.size > 5 * 1024 * 1024) {
              return res.status(400).json({ message: "La imagen no debe superar 5MB" })
            }
    
            if (userToUpdate.profile_photo != "https://i.postimg.cc/zvfFVFnB/default-user.png") {
                try {
                    const publicId = userToUpdate.profile_photo.split('/').pop().split('.')[0]
                    await cloudinary.uploader.destroy(`profileImages/${publicId}`)
                    logger.info(`Imagen eliminada correctamente, usuario: ${userToUpdate.email}`)
                } catch (error) {
                    logger.error(`Error al eliminar  una imagen: ${error.message}`)
                }
            }
    
            const result = await cloudinary.uploader.upload(image.tempFilePath, {
              folder: "profileImages",
              quality: "auto:best",
              transformation: { width: 500, height: 500, crop: "limit" }
            })
    
            userToUpdate.profile_photo = result.secure_url
    
            await fs.promises.unlink(image.tempFilePath);
          }
          if (userUsername) userToUpdate.username = userUsername
          if (userBio) userToUpdate.bio = userBio
            
            if (userToUpdate.isConfig === false) {
                const existName = await userModel.findOne({ name: `@${userUsername.toLowerCase()}` })
                if (!existName) {
                    userToUpdate.name = userUsername.startsWith("@") ? userUsername.toLowerCase() : `@${userUsername.toLowerCase()}`;
                    userToUpdate.isConfig = true;
                    await userToUpdate.save();
                    return res.status(200).json({message: "Usuario actualizado correctamente", user: userToUpdate });
                }
                const combination = Math.floor(100000 + Math.random() * 900000)
                userToUpdate.name = `@${userUsername.toLowerCase()}${combination}`
                userToUpdate.isConfig = true
            }
            if (userToUpdate.isConfig === false) {
                return res.status(400).json({message: "Antes de configurar estos datos debes configurar tu username"})
            }
          await userToUpdate.save()
          return res.status(200).json({ message: "Usuario actualizado", user: userToUpdate })
    
        } catch (error) {
          logger.error(`Error 500 al configurar un usuario: ${error.message}`)
          return res.status(500).json({ message: "Error interno del servidor" })
        }
    },

    async followUser(req,res){
        const { userToFollow } = req.body

        if(!userToFollow){
            return res.status(400).json({message:"Debes entregar datos"})
        }

        const result = await userValidationSchema.safeParse(req.body)

        if(!result.success){
            return res.status(400).json({message:"Datos invalidos"})
        }

        try {
            const existUserToFollow = await userModel.findOne({name:userToFollow})

            if(!existUserToFollow){
                return res.status(404).json({message:"Usuario a seguir no existe"})
            }

            const existFollower = req.user

            if(existUserToFollow._id.toString() === existFollower._id.toString()) {
                return res.status(409).json({message: "No puedes seguirte a ti mismo"});
            }

            const isAlreadyFollowing = existUserToFollow.followers.some( //De buena manera verificamos si el usuario ya sigue al usuario, aunque en frontend se elimine la posibilidad de seguir dos veces, no viene mal asegurar el caso
                followerId => followerId.toString() === existFollower._id.toString() //Importante a la hora de comparar objectId hay que usar .toString() si no nunca se compararan correctamente
            );
            
            if(isAlreadyFollowing) {
                return res.status(409).json({message: "Ya sigues a este usuario"}); //Aca devolvemos lo antes mencionado
            }

            await userModel.updateOne({ _id: existUserToFollow._id },{ $addToSet: { followers: existFollower._id}})
            await userModel.updateOne({ _id: existFollower._id },{ $addToSet: { following: existUserToFollow._id}}) //$addToSet nos permite introducir ese dato al array
            return res.status(200).json({message:"Usuario seguido correctamente"})

        } catch (error) {
            logger.error(`Error 500 al seguir un usuario: ${error.message}`)
            return res.status(500).json({message:"Error interno al seguir al usuario"})
        }
    },

    async unfollowUser(req, res) {
        const { userToUnFollow } = req.body;
    
        if (!userToUnFollow) {
            return res.status(400).json({ message: "Debes entregar datos" });
        }
    
        const result = await userValidationSchema.safeParse(req.body);
    
        if (!result.success) {
            return res.status(400).json({ message: "Datos invalidos" });
        }
    
        try {
            const userToUnfollow = await userModel.findOne({ name: userToUnFollow });
    
            if (!userToUnfollow) {
                return res.status(404).json({ message: "Usuario a dejar de seguir no existe" });
            }
    
            const follower = req.user
    
            if (!follower) {
                return res.status(404).json({ message: "Usuario seguidor no existe" });
            }
    
            if (userToUnfollow._id.toString() === follower._id.toString()) {
                return res.status(409).json({ message: "No puedes dejar de seguirte a ti mismo" });
            }
    
            const isFollowing = follower.following.some(
                followingId => followingId.toString() === userToUnfollow._id.toString()
            );
    
            if (!isFollowing) {
                return res.status(409).json({ message: "No sigues a este usuario" });
            }
    
            await userModel.updateOne(
                { _id: userToUnfollow._id },
                { $pull: { followers: follower._id } } //Aca importante, $Pull se utiliza para remover items de un array en mongodb, su contraparte es $addToSet
            );
    
            await userModel.updateOne(
                { _id: follower._id },
                { $pull: { following: userToUnfollow._id } }
            );
    
            return res.status(200).json({ message: "Usuario dejado de seguir correctamente" });
    
        } catch (error) {
            logger.error(`Error 500 al dejar de seguir un usuario: ${error.message}`)
            return res.status(500).json({ message: "Error interno al dejar de seguir al usuario" });
        }
    },

    async searchUsers(req,res){
        let { userName, page = 1 } = req.params

        if(!userName){
            return res.status(400).json({message:"Debes entregar datos"})
        }

        if(userName.length > 41){
            return res.status(400).json({message:"Datos invalidos"})
        }

        if(!userName.startsWith("@")){
            userName= `@${userName}`
        }

        try {
            const safeUserName = escapeRegExp(userName);

            const options = {
                page: parseInt(page) || 1,
                limit: 20,
                select: '_id username name profile_photo followers',
                sort: { followers: -1 }
            };

            const result = await userModel.paginate({name:{$regex:"^" + safeUserName,$options: "i"}},options)

            return res.status(200).json({ users: result.docs, pagination: { currentPage: result.page, totalPages: result.totalPages, totalUsers: result.totalDocs, hasNextPage: result.hasNextPage}});
        } catch (error) {
            logger.error(`Error 500 al buscar usuarios: ${error.message}`)
            return res.status(500).json({message:"Ocurrio un error al buscar usuarios"})
        }
    }
}

//Funciones auxiliares
async function createCode(){
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let code = ""
    for (let i = 0; i < 6; i++) {
        code += characters[Math.floor(Math.random() * characters.length)];
    }
    return code
}

module.exports = userController
