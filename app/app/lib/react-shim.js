/**
 * Shim that re-exports everything from React and adds a useEffectEvent polyfill.
 * This is needed because Sanity imports useEffectEvent from 'react' directly,
 * but it's an internal API not exported from the public React package.
 */

// Import from the actual react package location to avoid circular imports
const React = require('./node_modules/react/index.js');

module.exports = {
    ...React,
    useEffectEvent: function useEffectEvent(fn) {
        const ref = { current: fn };
        // Keep ref up to date
        ref.current = fn;
        return React.useCallback(function (...args) {
            return ref.current.apply(this, args);
        }, []);
    },
};
