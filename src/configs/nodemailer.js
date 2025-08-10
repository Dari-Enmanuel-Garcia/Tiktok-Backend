const { EMAIL_ADDRESS, EMAIL_PASS, EMAIL_PORT, EMAIL_HOST } = process.env

const emailConfig = {
    host:EMAIL_HOST,
    port:EMAIL_PORT,
    auth:{
        user:EMAIL_ADDRESS,
        pass:EMAIL_PASS
    }

}

module.exports = emailConfig