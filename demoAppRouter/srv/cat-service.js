const cds = require("@sap/cds");
const jwtDecode = require("jwt-decode");

module.exports = cds.service.impl(function () {
  this.on(["READ"], "User", async (req) => {   
    if (req.user.is("admin")) {
      return {
        userId: req.user.id,
        isAdmin: true,
        jwtToken: jwtDecode(req.http.req.tokenInfo.getTokenValue())
      };
    } else {
      return {
          userId: req.user.id,
          isAdmin: false,
          jwtToken: jwtDecode(req.http.req.tokenInfo.getTokenValue())
      }
    }
  });
});