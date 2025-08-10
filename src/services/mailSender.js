const nodemailer = require("nodemailer")
const fs = require("fs")
const path = require("path")
const emailConfig = require("../configs/nodemailer")
const logger = require("../utils/logger")

function getHtmlTemplate({ appName, message, subject }) {
    const templatePath = path.join(__dirname, "../templates/emailTemplate.html")
    let html = fs.readFileSync(templatePath, "utf8")
    
    html = html.replaceAll("{{appName}}", appName)
               .replaceAll("{{message}}", message)
               .replaceAll("{{subject}}", subject)
               .replaceAll("{{year}}", new Date().getFullYear())
    return html
}

async function sendMail(appName,message,userEmail,subject) {

    try {
        const transport = nodemailer.createTransport(emailConfig)

        const html = getHtmlTemplate({ appName, message, subject })

        const messageOptions = {
            from:emailConfig.auth.user,
            to:userEmail,
            subject:subject,
            text: message,
            html
        }

        const info = await transport.sendMail(messageOptions)
        logger.info(`Correo enviado: ${info.messageId}`);

    } catch (error) {
        logger.error(`Error al enviar correo: ${error.stack || error.message}`);
    }
}

module.exports = sendMail
