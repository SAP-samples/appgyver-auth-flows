// Import required modules
const xsenv = require("@sap/xsenv");
const passport = require("passport");
const jwtDecode = require("jwt-decode");
const axios = require("axios");
const https = require("https");
const { JWTStrategy, TokenInfo } = require("@sap/xssec");
const NodeCache = require("node-cache");

// Create new cache for tokens
// Consider using a Redis Cache for productive scenarios
const tokenCache = new NodeCache();

// Get IAS configuration from environment services
// Binding existence already checked in index.js
const iasConfig = xsenv.getServices({ ias: { label: "identity" } }).ias;

// Use JWTStrategy from xssec module for passport
passport.use("IAS", new JWTStrategy(iasConfig, "IAS"));

module.exports = {
  insertMiddleware: {
    first: [
      /**
       * Middleware function for handling IAS token exchange with JWT tokens.
       * @function
       * @param {object} req - The request object.
       * @param {object} res - The response object.
       * @param {function} next - The next middleware function.
       */
      function middleware(req, res, next) {
        try {
          // Get the authorization token from the headers
          const tokenInfo = new TokenInfo(req.headers?.authorization?.split("Bearer ")[1] || null);

          // If the token is invalid or issued by XSUAA proceed to next middleware
          // Token is not "verified", as it will run through passport before being stored in cache
          if (!tokenInfo.isValid() || tokenInfo.isTokenIssuedByXSUAA()) { return next() };
          
          // Store encoded token value
          const token = tokenInfo.getTokenValue();
          
          // Check if token is cached
          const cachedToken = tokenCache.get(token);

          // If token exists in cache, set it in header and go to next middleware
          if (cachedToken) {
            req.headers["x-approuter-authorization"] = `Bearer ${cachedToken}`;
            return next();
          } else {
            // If token not in cache, authenticate it
            passport.authenticate( "IAS", { session: false, failWithError: true }, async (err) => {
              try{
                  // If error in authentication, send error message
                  if (err) {
                    res.statusCode = err?.response?.status || 401; 
                    return res.end(`Error: ${err.message}`);
                  }
          
                  // Exchange the token
                  const exchangedToken = await exchangeToken(token);
                  
                  // Cache the exchanged token and set it in header
                  tokenCache.set(token, exchangedToken, jwtDecode(exchangedToken).exp || 3600);
                  req.headers["x-approuter-authorization"] = `Bearer ${exchangedToken}`;

                  // Proceed to next middleware
                  return next();
              }catch(err){
                console.error(err.message);
                res.statusCode = err.response?.status || 500
                return res.end(`Error: ${err.message}`);
              }
            })(req, res, next);
          }
        } catch (err) {
          console.error(err.message);
          res.statusCode = err.response?.status || 500
          return res.end(`Error: ${err.message}`);
        }
      },
    ],
  },
};


/**
 * Exchange a given JWT token for an ID token from SAP IAS OAuth Server.
 *
 * @async
 * @param {string} token - The JWT token to be exchanged.
 * @returns {Promise<string>} The ID token from the OAuth 2.0 server.
 * @throws {Error} If the token exchange fails.
 */
async function exchangeToken(token) {
  try {
    // Prepare the request options for the token exchange.
    const options = {
      method: "POST",
      // The URL of the SAP IAS token endpoint.
      url: `${iasConfig.url}/oauth2/token`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      // The body of the request, including the grant type, client ID, and the JWT token as assertion.
      data: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        client_id: iasConfig.clientid,
        // Remove 'Bearer ' prefix from the token if it exists.
        assertion: token.split("Bearer ")[1] || token,
      }).toString(),
      // Configure the HTTPS agent with the certificate and key.
      httpsAgent: new https.Agent({
        cert: iasConfig.certificate,
        key: iasConfig.key,
      }),
    };

    // Send the request and wait for the response.
    const response = await axios(options);
    // Return the ID token from the response.
    return response.data?.id_token;
  } catch (err) {
    // Log the error message and re-throw the error.
    console.error(err.message);
    throw(err)
  }
}