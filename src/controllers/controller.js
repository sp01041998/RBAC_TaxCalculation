const userModel = require("../models/taxPayers")
const mongoose = require("mongoose")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt");

const moment = require("moment")


const isValid = function (value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    if (typeof value === 'number' && value.toString().trim().length === 0) return false
    return true
}

const isValidTitle = function (title) {
    return ['Mr', "Mrs", "Miss"].indexOf(title) !== -1
}

const isValidTaxStatus = function (taxStatus) {
    return ["New", "Paid", "Delay"].indexOf(taxStatus) !== -1
}

const isValidRole = function (role) {
    return ["tax-payer", "tax-accountant", "admin"].indexOf(role) !== -1
}



// 1st API a user need to signup first with few basics details

const createUser = async function (req, res) {
    try {
        data = req.body
        let obj = {}


        if (Object.keys(data).length > 0) {

            const { title, name, phone, email, password, role } = data

            if (!isValid(title)) {
                return res.status(400).send({ status: false, msg: "title is not valid/title is missing" })
            }

            if (!isValidTitle(title)) {
                return res.status(400).send({ status: false, msg: "title is not correct" })
            }

            obj.title = title


            if (!isValid(name)) {
                return res.status(400).send({ status: false, msg: "name is not valid/name is missing" })
            }
            obj.name = name


            //email validation

            if (!isValid(email)) {
                return res.status(400).send({ status: false, message: "email is required" })
            }

            if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
                return res.status(400).send({ status: false, msg: "Email should be valid email address" })
            }

            const isEmailalredyUsed = await userModel.findOne({ email }) //{email :email} object shorthand property

            if (isEmailalredyUsed) {
                return res.status(400).send({ status: false, msg: "email already in use" })
            }
            obj.email = email



            //phone number validation

            if (!isValid(phone)) {
                return res.status(400).send({ status: false, msg: "phone is not valid/phone is missing" })
            }

            if (phone.length != 10) {
                return res.status(400).send({ status: false, msg: "phone length needs to be of 10 digit" })
            }

            if (!/^[0-9]{10}$/.test(phone)) {
                return res.status(400).send({ status: false, msg: "phone should be valid phone number" })
            }

            let isphonealreadyused = await userModel.findOne({ phone: phone })
            if (isphonealreadyused) {
                return res.status(400).send({ status: false, msg: "phone number is already in use" })
            }
            obj.phone = phone


            //password validation

            if (!isValid(password)) {
                return res.status(400).send({ status: false, msg: "password is not valid/password is missing" })
            }

            if (password.length < 8 || password.length > 15) {
                return res.status(400).send({ status: false, msg: "passowrd min length is 8 and max len is 15" })
            }

            const securePassword = await bcrypt.hash(password, 10);

            obj.password = securePassword

            // role validation
            if (role) {
                if (!isValidRole(role)) {
                    return res.status(400).send({ status: false, msg: "role is wrong input" })
                }
                obj.role = role
            }

            obj.taxPaidTill_FY = "2021"

            const userCreated = await userModel.create(obj)
            return res.status(201).send({ status: true, msg: "user Created", data: userCreated })

        } else {
            return res.status(400).send({ status: false, msg: "Body is missing" })
        }


    } catch (err) {
        return res.status(500).send({ status: false, msg: err.message })
    }
}

const userLogin = async function (req, res) {
    try {
        let data = req.body

        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, msg: "body is missing" })
        }
        const { email, password } = data

        if (!isValid(email)) {
            return res.status(400).send({ status: false, msg: "email is not valid" })
        }

        if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
            return res.status(400).send({ status: false, msg: "Email should be valid email address" })
        }


        if (!isValid(password)) {
            return res.status(400).send({ status: false, msg: "password is missing" })
        }

        if (password.length < 8 || password.length > 15) {
            return res.status(400).send({ status: false, msg: "password length should be in between 8 to 15" })
        }

        const checkEmailExist = await userModel.findOne({ email })
        if (!checkEmailExist) {
            return res.status(401).send({ status: false, msg: "email is wrong" })
        }

        let encodedPassword = checkEmailExist.password

        const checkPassWord = await bcrypt.compare(password, encodedPassword)


        if (checkPassWord) {
            let token = jwt.sign(
                { userId: checkEmailExist._id },
                "Ronaldo-007",
                { expiresIn: "1d" }
            )

            res.setHeader("x-api-token", token)
            res.status(200).send({ status: true, msg: "User login successful", data: { userId: checkEmailExist._id, token: token } })

        } else {
            return res.status(401).send({ status: false, msg: "password is not correct" })
        }

    } catch (err) {
        return res.status(500).send({ status: false, msg: err.message })
    }
}



//get all users tax status(accessed by --- tac-accountant and admin)

const getAllUserTaxStatus = async function (req, res) {
    try {

        const users = await userModel.find().lean()

        for (let el of users) {
            delete el.password
            delete el.role
        }

        return res.status(200).send({ status: true, data: users })

    } catch (err) {
        return res.status(500).send({ status: false, msg: err })
    }
}




// get your own profile with tax status(accessed by everyone(but you are only able to see your own's profile))

const getUser = async function (req, res) {
    try {
        let userId = req.params.userId
        const user = await userModel.findById(userId).lean()
        if (!user) {
            return res.status(400).send({ status: false, msg: "user does not exist in our system" })
        }
        delete user.password
        delete user.role
        return res.status(200).send({ status: true, msg: user })

    } catch (err) {
        return res.status(500).send({ status: false, msg: err })
    }
}



// tax calculation(amount) and due status(accessed by -- tax-accountant and admin)

const taxStatus = async function (req, res) {
    try {

        const { annualSalary, StandardDeduction, dedecution_80C, HRA, userId } = req.body

        if (!annualSalary) {
            return res.status(400).send({ status: false, msg: "Pls provide your yerly income" })
        }

        let taxableIncome = annualSalary

        if (StandardDeduction) {
            taxableIncome = taxableIncome - StandardDeduction
        }

        if (dedecution_80C) {
            taxableIncome = taxableIncome - dedecution_80C
        }

        if (HRA) {
            taxableIncome = taxableIncome - HRA
        }

        let dueTax = 0

        if (taxableIncome <= 250000) {
            dueTax = 0
        } else if (taxableIncome > 250000 && taxableIncome <= 500000) {
            dueTax = ((taxableIncome - 250000) * 0.05)
        } else if (taxableIncome > 500000 && taxableIncome <= 1000000) {
            dueTax = ((taxableIncome - 500000) * 0.2) + 12500
        } else {
            dueTax = ((taxableIncome - 1000000) * 0.3) + 112500
        }

        let netTaxableIncome = dueTax * 1.04

        let userDetails = await userModel.findById(userId)

        const today = moment()


        let YY = today.format("YYYY")
        let MM = today.format("M")

        if (Number(YY) > Number(userDetails.taxPaidTill_FY)) {

            if (Number(MM) >= 4 && Number(MM) < 11) {

                let updateTax = await userModel.findOneAndUpdate(
                    { _id: userId },
                    { $set: { taxStatus: "NEW", taxDue: netTaxableIncome } },
                    { new: true }
                )

                return res.status(200).send({ status: true, Data: updateTax })

            } else {
                netTaxableIncome = netTaxableIncome + 5000 // adding fine for not filling ITR before due time
                let updateTax = await userModel.findOneAndUpdate(
                    { _id: userId },
                    { $set: { taxStatus: "DELAYED", taxDue: netTaxableIncome } }
                )

                return res.status(200).send({ status: true, Data: updateTax })

            }

        } else {
            return res.status(400).send({ status: false, msg: "Income tax is already paid for this FY" })
        }

    } catch (err) {

        return res.status(500).send({ status: false, msg: err })
    }

}

// tax payment made by user(tax-payer)(you can make payment on your own profile)
const taxPayment = async function (req, res) {
    try {
        const userId = req.params.userId

        const checkUser = await userModel.findById({ _id: userId }).lean()
        if (!checkUser) {
            return res.status(400).send({ status: false, msg: "user not found" })
        }

        if (checkUser.taxStatus == "PAID") {
            return res.status(400).send({ status: false, msg: "Tax is already paid" })
        }

        let year = Number(checkUser.taxPaidTill_FY) + 1




        const makePayment = await userModel.findOneAndUpdate(
            { _id: userId },
            { $set: { taxDue: 0, taxStatus: "PAID", taxPaidTill_FY: year } },
            { new: true }
        )

        return res.status(200).send({ status: false, Data: makePayment })

    } catch (err) {
        return res.status(500).send({ status: false, msg: err })
    }
}


// filter tax payers list(accessed by -- tax-accountant and admin)
const filterTaxPayer = async function (req, res) {
    try {
        let { email, taxStatus, taxPaidTill_FY, taxDue_greaterThan, taxDue_lessThan } = req.query

        let obj = {}

        // check user access(if a tax-payer want to use this api  or taxAccounttant/admin)



        const userDetails = await userModel.findById(req.userId)
        if (userDetails.role == "tax-payer") {
            return res.status(200).send({ status: true, msg: userDetails })
        }



        /// email validation

        if (email) {
            if (!isValid(email)) {
                return res.status(400).send({ status: false, message: "email is required" })
            }

            if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
                return res.status(400).send({ status: false, msg: "Email should be valid email address" })
            }
            obj.email = email

        }

        if (taxStatus) {
            obj.taxStatus = { $in: taxStatus }
        }

        if (taxPaidTill_FY) {
            obj.taxPaidTill_FY = taxPaidTill_FY
        }

        if (isValid(taxDue_greaterThan) && isValid(taxDue_lessThan)) {
            taxDue_greaterThan = Number(taxDue_greaterThan)
            taxDue_lessThan = Number(taxDue_lessThan)

            if (taxDue_lessThan < taxDue_greaterThan) {
                return res.status(400).send({ status: false, msg: "wrong filter value in tax due" })
            }

            obj.taxDue = { $gte: taxDue_greaterThan, $lte: taxDue_lessThan }


        } else if (isValid(taxDue_lessThan)) {
            taxDue_lessThan = Number(taxDue_lessThan)
            obj.taxDue = {}
            obj.taxDue.$lte = taxDue_lessThan
        } else if (isValid(taxDue_greaterThan)) {
            taxDue_greaterThan = Number(taxDue_greaterThan)
            obj.taxDue = {}
            obj.taxDue.$gte = taxDue_greaterThan
        }

        const userList = await userModel.find(obj)

        if (userList.length == 0) {
            return res.status(200).send({ status: true, msg: "does not found any tax-payer, kindly pls change your filter value" })
        }

        return res.status(200).send({ status: true, msg: userList })
    } catch (err) {
        return res.status(500).send({ status: false, msg: err })
    }
}


module.exports.createUser = createUser
module.exports.userLogin = userLogin
module.exports.getAllUserTaxStatus = getAllUserTaxStatus
module.exports.getUser = getUser
module.exports.taxStatus = taxStatus
module.exports.taxPayment = taxPayment
module.exports.filterTaxPayer = filterTaxPayer