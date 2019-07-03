"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = react$$;

var _fs = _interopRequireDefault(require("fs"));

var _getElementObject = require("../../utils/getElementObject");

var _resq = require("../../scripts/resq");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 *
 * The `react$$` command is a useful command to query multiple React Components
 * by their actual name and filter them by props and state.
 *
 * **NOTE:** the command only works with applications using React v16.x
 *
 * <example>
    :pause.js
    it('should calculate 7 * 6', () => {
        browser.url('https://ahfarmer.github.io/calculator/');
        const appWrapper = browser.$('div#root')

        const orangeButtons = appWrapper.react$$('t', { orange: true })
        console.log(orangeButtons.map((btn) => btn.getText())); // prints "[ '÷', 'x', '-', '+', '=' ]"
    });
 * </example>
 *
 * @alias react$$
 * @param {String} selector of React component
 * @param {Object=} props  React props the element should contain
 * @param {Array<any>|number|string|object|boolean=} state  React state the element should be in
 * @return {Element[]}
 *
 */
const resqScript = _fs.default.readFileSync(require.resolve('resq'));

async function react$$(selector, props = {}, state = {}) {
  await this.executeScript(resqScript.toString(), []);
  await this.execute(_resq.waitToLoadReact);
  const res = await this.execute(_resq.react$$, selector, props, state, this);
  return _getElementObject.getElements.call(this, selector, res);
}