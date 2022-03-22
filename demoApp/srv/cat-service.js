const cds = require("@sap/cds");
const jsonwebtoken = require("jsonwebtoken");

module.exports = cds.service.impl(function () {

  this.on(["READ"], "User", async (req) => {   
    if (req.user.is("admin")) {
      return {
        userId: req.user.id,
        isAdmin: true,
        jwtToken: jsonwebtoken.decode(req._.req.tokenInfo.getTokenValue())
      };
    } else {
      return {
          userId: req.user.id,
          isAdmin: false,
          jwtToken: jsonwebtoken.decode(req._.req.tokenInfo.getTokenValue())
      }
    }
  });
});