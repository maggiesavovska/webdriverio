import path from 'path'
import WebDriver from 'webdriver'
import { validateConfig, wrapCommand, runFnInFiberContext, detectBackend } from '@wdio/config'

import MultiRemote from './multiremote'
import { WDIO_DEFAULTS } from './constants'
import { getPrototype } from './utils'

// Capability names that are defined in the W3C spec.
const W3C_CAPABILITY_NAMES = new Set([
    'acceptInsecureCerts',
    'browserName',
    'platformName',
    'browserVersion',
    'name',
    'pageLoadStrategy',
    'proxy',
    'setWindowRect',
    'timeouts',
    'unhandledPromptBehavior',
]);

function filterNonW3CCaps(capabilities) {
  let newCaps = JSON.parse(JSON.stringify(capabilities));
  for (let k of Object.keys(newCaps)) {
    // Any key containing a colon is a vendor-prefixed capability.
    if (!(W3C_CAPABILITY_NAMES.has(k) || k.indexOf(':') >= 0)) {
      delete newCaps[k];
    }
  }
  return newCaps;
}

/**
 * A method to create a new session with WebdriverIO
 *
 * @param  {Object} [params={}]       Options to create the session with
 * @param  {function} remoteModifier  Modifier function to change the monad object
 * @return {object}                   browser object with sessionId
 */
export const remote = async function (params = {}, remoteModifier) {
    const config = validateConfig(WDIO_DEFAULTS, params)
    const modifier = (client, options) => {
        if (typeof remoteModifier === 'function') {
            client = remoteModifier(client, Object.assign(options, config))
        }

        Object.assign(options, config)
        return client
    }

    if (params.user && params.key) {
        params = Object.assign({}, detectBackend(params), params)
    }

    const myAPIName = params.capabilities.browser_api_name;

params.capabilities = filterNonW3CCaps(params.capabilities);
params.capabilities.browser_api_name = myAPIName;

    if(params.outputDir){
        process.env.WDIO_LOG_PATH = path.join(params.outputDir, 'wdio.log')
    }

    const prototype = getPrototype('browser')
    const instance = await WebDriver.newSession(params, modifier, prototype, wrapCommand)

    /**
     * we need to overwrite the original addCommand and overwriteCommand
     * in order to wrap the function within Fibers
     */
    const origAddCommand = ::instance.addCommand
    instance.addCommand = (name, fn, attachToElement) => (
        origAddCommand(name, runFnInFiberContext(fn), attachToElement)
    )

    const origOverwriteCommand = ::instance.overwriteCommand
    instance.overwriteCommand = (name, fn, attachToElement) => (
        origOverwriteCommand(name, runFnInFiberContext(fn), attachToElement)
    )

    return instance
}

export const attach = function (params) {
    const prototype = getPrototype('browser')
    return WebDriver.attachToSession(params, null, prototype, wrapCommand)
}

export const multiremote = async function (params = {}) {
    const multibrowser = new MultiRemote()
    const browserNames = Object.keys(params)

    /**
     * create all instance sessions
     */
    await Promise.all(
        browserNames.map((browserName) => {
            const config = validateConfig(WDIO_DEFAULTS, params[browserName])
            const modifier = (client, options) => {
                Object.assign(options, config)
                return client
            }
            const prototype = getPrototype('browser')
            const instance = WebDriver.newSession(params[browserName], modifier, prototype, wrapCommand)
            return multibrowser.addInstance(browserName, instance)
        })
    )

    /**
     * use attachToSession capability to wrap instances around blank pod
     */
    const prototype = getPrototype('browser')
    const sessionParams = {
        sessionId: '',
        isW3C: multibrowser.instances[browserNames[0]].isW3C,
        logLevel: multibrowser.instances[browserNames[0]].options.logLevel
    }
    const driver = WebDriver.attachToSession(sessionParams, ::multibrowser.modifier, prototype, wrapCommand)

    /**
     * in order to get custom command overwritten or added to multiremote instance
     * we need to pass in the prototype of the multibrowser
     */
    const origAddCommand = ::driver.addCommand
    driver.addCommand = (name, fn, attachToElement) => {
        origAddCommand(name, runFnInFiberContext(fn), attachToElement, Object.getPrototypeOf(multibrowser.baseInstance), multibrowser.instances)
    }

    const origOverwriteCommand = ::driver.overwriteCommand
    driver.overwriteCommand = (name, fn, attachToElement) => {
        origOverwriteCommand(name, runFnInFiberContext(fn), attachToElement, Object.getPrototypeOf(multibrowser.baseInstance), multibrowser.instances)
    }

    return driver
}
