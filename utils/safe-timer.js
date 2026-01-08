/**
 * Node.js setTimeout has a limit of 2147483647ms (approx 24.8 days).
 * This utility allows for timeouts longer than that limit by chaining timers.
 */
function setLongTimeout(callback, delay) {
    const maxDelay = 2147483647;

    if (delay > maxDelay) {
        return setTimeout(() => {
            setLongTimeout(callback, delay - maxDelay);
        }, maxDelay);
    } else {
        return setTimeout(callback, delay);
    }
}

module.exports = { setLongTimeout };
