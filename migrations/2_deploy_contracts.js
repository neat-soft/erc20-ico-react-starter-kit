/* eslint-disable */
const Crowdsale = artifacts.require('./Crowdsale.sol');

module.exports = function(deployer) {
  // Parametrs:
  // - beginning of pre-ICO
  // - beginning of ICO
  // - duration pre-ICO in hours (4 weeks = 28 days = 672 hours)
  // - duration ICO in hours (6 weeks = 42 days = 1008 hours)
  // - ETH/USD (cents)
  deployer.deploy(
    Crowdsale,
    Math.round(new Date().getTime()/1000.0) + 60,
    Math.round(new Date().getTime()/1000.0 + 3024000) + 60,
    672, 1008, 30000,
    0x5aeda56215b167893e80b4fe645ba6d5bab767de
  );
};
