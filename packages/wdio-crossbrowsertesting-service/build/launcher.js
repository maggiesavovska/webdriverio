"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _cbt_tunnels = _interopRequireDefault(require("cbt_tunnels"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class CrossBrowserTestingLauncher {
  onPrepare(config) {
    if (!config.cbtTunnel) {
      return;
    }

    this.cbtTunnelOpts = Object.assign({
      username: config.user,
      authkey: config.key
    }, config.cbtTunnelOpts);
    return new Promise((resolve, reject) => _cbt_tunnels.default.start({
      'username': config.user,
      'authkey': config.key
    }, err => {
      if (err) {
        return reject(err);
      }

      this.tunnel = true;
      return resolve('connected');
    }));
  }

  onComplete() {
    if (!this.tunnel) {
      return;
    }

    return new Promise((resolve, reject) => _cbt_tunnels.default.stop(err => {
      if (err) {
        return reject(err);
      }

      return resolve('stopped');
    }));
  }

}

exports.default = CrossBrowserTestingLauncher;