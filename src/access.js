const AccessControl = require("accesscontrol");
const ac = new AccessControl();
 
exports.roles = (function() {
ac.grant("tax-payer")
 .readOwn("profile")
 .updateOwn("profile")
 .readAny("profile")
 .deleteOwn("profile")
 
ac.grant("tax-accountant")
 .extend("tax-payer")
 .updateAny("profile")
 
ac.grant("admin")
 .extend("tax-payer")
 .extend("tax-accountant")
 .deleteAny("profile")
 .createAny("profile")
 
return ac;
})();