const express = require('express');
const router = express.Router();

const userController = require("../controllers/controller")
const accessMiddleware = require("../middlewares/middlewares")


// test-me

router.get("/test-me", function(req, res){
    res.send({staus: true, message : "working"})
})


/// user's API
router.post("/uer/signIn", userController.createUser)

router.get("/userLogin", userController.userLogin)

router.get("/user/taxStatus", accessMiddleware.authenticate, accessMiddleware.grantedAccess('readAny', 'profile'), userController.getAllUserTaxStatus)

router.get("/userDetails/:userId", accessMiddleware.authenticate,accessMiddleware.authorize, userController.getUser)

router.get("/user/newTaxStatus", accessMiddleware.authenticate,  accessMiddleware.grantedAccess('updateAny', 'profile'),    userController.taxStatus)

router.get("/user/makePayment/:userId", accessMiddleware.authenticate, accessMiddleware.authorize, userController.taxPayment)

router.get("/user/filterTaxPayer",  accessMiddleware.authenticate, accessMiddleware.grantedAccess('readAny', "profile"), userController.filterTaxPayer)




module.exports=router