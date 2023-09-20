"use strict";

const cds = require("@sap/cds");
const cors = require("cors");
const xsenv = require("@sap/xsenv");

try {
    // PKCE token exchange must be enabled
    if(process.env["IAS_PKCE_XCHANGE_ENABLED"] === 'true'){
      // Try to get the IAS service - Throws error if not bound
      xsenv.getServices({ ias: { label: "identity" } }).ias;
      // Load the the tokenExchange middleware
      cds.middlewares.add(require("./mw/tokenExchange.js"), { at: 0 });
    }
} catch (error) {
    console.log("[cds] - SAP IAS binding is missing, therefore CAP will not exchange tokens");
}

cds.on("bootstrap", (app) => { app.use(cors()) });
module.exports = cds.server;
