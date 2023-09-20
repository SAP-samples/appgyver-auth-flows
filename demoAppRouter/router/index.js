const xsenv = require("@sap/xsenv");
const ar = require('@sap/approuter')();
const ext = new Array();

try {
  // PKCE token exchange must be enabled
  if(process.env["IAS_PKCE_XCHANGE_ENABLED"] === 'true'){
    // Try to get the IAS service - Throws error if not bound
    xsenv.getServices({ ias: { label: "identity" } }).ias;

    // Load the pkce.js extension
    ext.push(require('./extensions/pkce.js'));
  }
} catch (error) {
  // Log an error if IAS binding is missing
  console.log("SAP IAS binding is missing - Approuter will not exchange tokens");
}

ar.start({ extensions: ext });