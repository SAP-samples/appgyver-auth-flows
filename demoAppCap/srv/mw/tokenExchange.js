// Import necessary libraries
const xsenv = require("@sap/xsenv");
const passport = require("passport");
const jwtDecode = require("jwt-decode");
const axios = require("axios");
const https = require("https");
const { JWTStrategy, TokenInfo } = require("@sap/xssec");
const NodeCache = require("node-cache");

// Initialize a cache for tokens
// Consider using a Redis Cache for productive scenarios
const tokenCache = new NodeCache();

// Get IAS configuration details from the environment
// Binding existence already checked in server.js
const iasConfig = xsenv.getServices({ ias: { label: "identity" } }).ias;

// Use JWT Strategy for passport with IAS configuration
passport.use("IAS", new JWTStrategy(iasConfig, "IAS"));


/**
 * Middleware function for handling IAS token exchange with JWT tokens.
 * 
 * @param {object} req - The request object
 * @param {object} res - The response object
 * @param {function} next - The next middleware function
 * @returns {function} next - Returns the next middleware function after processing
 */
module.exports = function middleware(req, res, next) {
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

    if (cachedToken) {
      // If token is cached, use the cached token and proceed to next middleware
      req.headers["authorization"] = `Bearer ${cachedToken}`;
      return next();
    } else {
      // If token is not cached, authenticate using passport
      passport.authenticate( "IAS", { session: false, failWithError: true }, async (err) => {
          try{
              // If error in authentication, send error message
              if (err) return res.status(err.response?.status || 401).send(`Error: ${err.message}`);

              // Exchange token
              const exchangedToken = await exchangeToken(token);

              // Set the exchanged token in the cache
              tokenCache.set(token, exchangedToken, jwtDecode(exchangedToken).exp || 3600);

              // Set the authorization header with the new token
              req.headers["authorization"] = `Bearer ${exchangedToken}`;

              // Proceed to next middleware
              return next();
          }catch(err){
              console.error(err.message);
              // If error, send error message with status
              return res.status(err.response?.status || 500).send(`Error: ${err.message}`);
          }
        }
      )(req, res, next);
    }
  } catch (err) {
    console.error(err.message);
    // If error, send error message with status
    return res.status(err.response?.status || 500).send(`Error: ${err.message}`);
  }
};


/**
 * Exchanges a given token for an SAP IAS ID token.
 *
 * @param {string} token - The JWT token to exchange. 
 * @return {Promise<string>} The ID token returned by the server.
 * @throws {Error} If an error occurs during the token exchange.
 */
async function exchangeToken(token) {
  try {
    // Prepare the options for the POST request
    const options = {
      method: "POST",
      url: `${iasConfig.url}/oauth2/token`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      data: new URLSearchParams({
        // Use the JWT Bearer grant type for the OAuth2 token request
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        client_id: iasConfig.clientid,
        // If the token is a Bearer token, remove the "Bearer " prefix
        assertion: token.split("Bearer ")[1] || token,
      }).toString(),
      httpsAgent: new https.Agent({
        // Use the configured certificate and key for the HTTPS agent
        cert: iasConfig.certificate,
        key: iasConfig.key,
      }),
    };

    // Make the POST request and wait for the response
    const response = await axios(options);

    // Return the ID token from the response
    return response.data?.id_token;
  } catch (err) {
    // Log the error message and re-throw the error
    console.error(err.message);
    throw(err)
  }
}
