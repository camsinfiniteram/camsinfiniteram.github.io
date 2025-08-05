/**
 * Applies a Hamming window to the buffer.
 * @param {Float32Array} buffer The input signal.
 * @returns {Float32Array} The windowed signal.
 */
export function applyWindow(buffer) {
    const N = buffer.length;
    const windowed = new Float32Array(N);
    for (let i = 0; i < N; i++) {
        windowed[i] = buffer[i] * (0.54 - 0.46 * Math.cos(2 * Math.PI * i / (N - 1))); // Hamming window coefficients
    }
    return windowed;
}

/**
 * Calculates the LPC coefficients for a given signal.
 * @param {Float32Array} signal The input signal.
 * @param {number} p The order of the LPC analysis.
 * @returns {{a: Float32Array | null, err: number}} The LPC coefficients and the prediction error.
 */
export function lpc(signal, p) {
    const n = signal.length;
    if (p >= n) return { a: null, err: 0 };

    // Autocorrelation
    const R = new Float32Array(p + 1);
    for (let i = 0; i <= p; i++) {
        let sum = 0;
        for (let j = 0; j < n - i; j++) {
            sum += signal[j] * signal[j + i];
        }
        R[i] = sum;
    }

    // Levinson-Durbin recursion
    let a = new Float32Array(p + 1);
    let a_prev = new Float32Array(p + 1);
    let err = R[0];

    if (Math.abs(err) < 1e-9) { // If signal is silent, return zero coefficients
        return { a: new Float32Array(p + 1), err: 0 };
    }

    a[0] = 1.0;

    for (let i = 1; i <= p; i++) {
        let k = -R[i];
        for (let j = 1; j < i; j++) {
            k -= a_prev[j] * R[i - j];
        }
        k /= err;

        a[i] = k;
        for (let j = 1; j < i; j++) {
            a[j] = a_prev[j] + k * a_prev[i - j];
        }

        err *= (1 - k * k);

        // Save current 'a' for next iteration
        for (let j = 1; j <= i; j++) a_prev[j] = a[j];
    }

    return { a, err };
}
