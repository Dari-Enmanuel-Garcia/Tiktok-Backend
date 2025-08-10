const express = require("express")
const cors = require("cors")
require("dotenv").config()
const mongoose = require("mongoose")
const cookieParser = require("cookie-parser")
const fileUpload = require("express-fileupload")
const helmet = require("helmet");
const expressSanitizer = require("express-sanitizer");
const sanitizeMiddleware = require("./src/middlewares/sanitize");
const logger = require("./src/utils/logger")

const { PORT, MONGODB } = process.env;

const userRouter = require("./src/router/user")
const videoRouter = require("./src/router/video")
const app = express();

async function connectDB() {
    try {
        await mongoose.connect(MONGODB)
        logger.info("Conectado a MongoDB")
    } catch (error) {
        logger.error(`Error al conectar a MongoDB: ${error.message}`);
        process.exit(1);
    }
}

//Importante que utilicemos el fileUpload de express para poder gestionar los files
//Tambien cookieParser para gestionar facilmente el jwt

app.use(helmet())
app.use(express.json())
app.use(expressSanitizer())
app.use(sanitizeMiddleware) //Middleware para sanitizar los datos y evitar etiquetas html, se deberan implementar otras medidas de seguridad
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/', 
    createParentPath: true, 
    limits: { fileSize: 5 * 1024 * 1024 } 
}));
app.use(cors({ origin: "*",credentials:true }))
app.use(cookieParser())

//Aqui utilizamos las rutas de nuestro router, si no, no serian accesibles
app.use("/api",userRouter)
app.use("/api",videoRouter)


app.get("/", (req, res) => {
    return res.status(200).json("Server is Running") //Ruta por defecto
});

(async () => {
    await connectDB(); //Conectamos a mongodb, si no conecta la funcion da process exit para detener la ejecucion del server

    app.listen(PORT, () => {
        logger.info(`Servidor iniciado en http://localhost:${PORT}`)
    });
})();
