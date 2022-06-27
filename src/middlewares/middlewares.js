const { roles } = require("../access")
const jwt = require("jsonwebtoken")

const userModel = require("../models/taxPayers")


const authenticate =  async function (req, res, next) {
    try {
        let token = req.headers["x-api-token"]
        if (!token) {
            return res.status(404).send({ status: false, msg: "token is not present in header" })
        }

        let { userId, exp } = jwt.verify(token, "Ronaldo-007")
        if (exp < Date.now().valueOf / 1000) {
            return res.status(401).send({ error: "JWT token has expired, please login to obtain a new one" });
        }

        //, {ignoreExpiration: true})
        req.user = await userModel.findById(userId);


        req.userId = userId


        next()

    } catch (err) {
        return res.status(500).send({ status: false, msg: err.messge })
    }
}

const authorize = async function (req, res, next) {
    try {
        let id = req.params.userId

        if (!id) {

            return res.status(400).send({status : false, msg : "pls provide your id in Path params"})
        }
        let checkUserExist = await userModel.findById(id)
        if (!checkUserExist) {
            return res.status(404).send({ status: false, msg: "pls give right id of Your's" })
        }

        if (id !== req.userId) {
            return res.status(403).send({ status: false, msg: "you are not authoried" })
        }

        next()




    } catch (err) {
        return res.status(500).send({ status: false, msg: err })
    }
}





const grantedAccess = function (action, resource) {
    return async (req, res, next) => {
        try {
            const permission = roles.can(req.user.role)[action](resource)
            if (!permission.granted) {
                return res.status(401).send({ status: false, msg: "you do not have permission to access this resource" })
            }
            next()

        } catch (err) {
            return res.status(500).send({ status: false, msg: err })
        }
    }
    

}

module.exports.authenticate=authenticate
module.exports.authorize=authorize
module.exports.grantedAccess=grantedAccess
