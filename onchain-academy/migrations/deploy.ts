// Migrations are an early feature. Currently, they're nothing more than this
// temporary script that wraps the deploy command
const anchor = require("@coral-xyz/anchor");

module.exports = async function (provider) {
  // Configure client to use the provider.
  anchor.setProvider(provider);

  // Add your deploy script here.
};
