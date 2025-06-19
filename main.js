// DOM element references
const startButton = document.getElementById('startButton');
const canvas = document.getElementById('visualizerCanvas');
const lpcOrderInput = document.getElementById('lpcOrder');
const lpcOrderValue = document.getElementById('lpcOrderValue');
const messageEl = document.getElementById('message');
const canvasCtx = canvas.getContext('2d');

let audioContext;
let analyser;
let microphone;
let javascriptNode;
let isCapturing = false;
let lpcOrder = parseInt(lpcOrderInput.value);

// Set canvas dimensions
function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Update LPC order from range input
lpcOrderInput.addEventListener('input', (e) => {
    lpcOrder = parseInt(e.target.value);
    lpcOrderValue.textContent = lpcOrder;
});

// Event listener for the start button
startButton.addEventListener('click', () => {
    if (!isCapturing) {
        startCapture();
    } else {
        stopCapture();
    }
});

// Function to start audio capture
async function startCapture() {
    messageEl.textContent = '';
    try {
        // Initialize AudioContext
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Get audio stream from microphone
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        microphone = audioContext.createMediaStreamSource(stream);

        // Create an analyser node
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        
        // Create a script processor node for custom processing
        javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);
        javascriptNode.onaudioprocess = processAudio;

        // Connect the nodes: microphone -> analyser -> javascriptNode -> destination
        microphone.connect(analyser);
        analyser.connect(javascriptNode);
        javascriptNode.connect(audioContext.destination);

        isCapturing = true;
        startButton.textContent = 'Stop Audio Capture';
        startButton.classList.remove('bg-blue-600', 'hover:bg-blue-700');
        startButton.classList.add('bg-red-600', 'hover:bg-red-700');
    } catch (err) {
        console.error('Error accessing microphone:', err);
        messageEl.textContent = 'Could not access the microphone. Please grant permission.';
    }
}

// Function to stop audio capture
function stopCapture() {
    if (microphone) {
        microphone.disconnect();
        analyser.disconnect();
        javascriptNode.disconnect();
        // Stop all tracks in the stream to turn off the microphone light
        microphone.mediaStream.getTracks().forEach(track => track.stop());
    }
    if (audioContext) {
        audioContext.close();
    }
    isCapturing = false;
    startButton.textContent = 'Start Audio Capture';
    startButton.classList.remove('bg-red-600', 'hover:bg-red-700');
    startButton.classList.add('bg-blue-600', 'hover:bg-blue-700');
}

// Main audio processing function
function processAudio(audioProcessingEvent) {
    const buffer = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buffer);

    // Apply a window function (Hamming)
    const windowedBuffer = applyWindow(buffer);

    // Perform LPC analysis
    const {a, err} = lpc(windowedBuffer, lpcOrder);
    
    if(a) {
         drawSpectralEnvelope(a);
    }
}

/**
 * Applies a Hamming window to the buffer.
 * @param {Float32Array} buffer The input signal.
 * @returns {Float32Array} The windowed signal.
 */
function applyWindow(buffer) {
    const N = buffer.length;
    const windowed = new Float32Array(N);
    for (let i = 0; i < N; i++) {
        windowed[i] = buffer[i] * (0.54 - 0.46 * Math.cos(2 * Math.PI * i / (N - 1))); //These are the coefficients for the Hamming window, which is commonly used in signal processing to reduce spectral leakage. (no idea what that means, but it sounds important)
    }
    return windowed;
}


/**
 * Calculates the LPC coefficients for a given signal.
 * @param {Float32Array} signal The input signal.
 * @param {number} p The order of the LPC analysis.
 * @returns {{a: Float32Array | null, err: number}} The LPC coefficients and the prediction error.
 */
function lpc(signal, p) {
    const n = signal.length;
    if (p >= n) return {a: null, err: 0};

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
        for(let j=1; j<=i; j++) a_prev[j] = a[j];
    }

    return {a, err};
}


/**
 * Draws the spectral envelope on the canvas, scaled to 0-5000Hz.
 * Also adds frequency labels to the X-axis.
 * @param {Float32Array} lpcCoefficients The LPC coefficients.
 */
function drawSpectralEnvelope(lpcCoefficients) {
    if (!audioContext) return;
    const sampleRate = audioContext.sampleRate;
    canvasCtx.fillStyle = '#1a202c';
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
    canvasCtx.textAlign = 'left';

    const maxFreq = 5000;
    canvasCtx.lineWidth = 1;
    canvasCtx.strokeStyle = '#374151';
    canvasCtx.fillStyle = '#9ca3af';
    canvasCtx.font = '12px Inter';
    const numGridLines = 5;
    for (let i = 0; i <= numGridLines; i++) {
        const freq = (maxFreq / numGridLines) * i;
        const x = (freq / maxFreq) * canvas.width;
        if (i > 0) {
            canvasCtx.beginPath();
            canvasCtx.moveTo(x, 0);
            canvasCtx.lineTo(x, canvas.height - 20);
            canvasCtx.stroke();
        }
        const label = `${freq / 1000}k`;
        canvasCtx.fillText(label, x - (i === 0 ? 0 : 10), canvas.height - 5);
    }

    // --- Calculate and Draw LPC Curve in dB ---
    canvasCtx.strokeStyle = '#4299e1';
    canvasCtx.lineWidth = 2;
    canvasCtx.beginPath();

    const numPoints = canvas.width;
    const freqResponse = new Float32Array(numPoints);
    let maxDb = -Infinity, minDb = Infinity;

    for (let i = 0; i < numPoints; i++) {
        const freq = (i / numPoints) * maxFreq;
        const w = 2 * Math.PI * freq / sampleRate;
        let re = 1.0, im = 0.0;
        for (let k = 1; k < lpcCoefficients.length; k++) {
            re += lpcCoefficients[k] * Math.cos(k * w);
            im += lpcCoefficients[k] * Math.sin(k * w);
        }
        const mag = 1.0 / Math.sqrt(re * re + im * im);
        // Convert to dB, add small value to avoid log(0)
        const db = 20 * Math.log10(mag + 1e-12);
        freqResponse[i] = db;
        if (db > maxDb) maxDb = db;
        if (db < minDb) minDb = db;
    }

    // Draw the curve, scaling dB to canvas height
    for (let i = 0; i < numPoints; i++) {
        const x = i;
        // Map dB to y (top = maxDb, bottom = minDb)
        const y = ((maxDb - freqResponse[i]) / (maxDb - minDb)) * (canvas.height - 25) + 5;
        if (i === 0) {
            canvasCtx.moveTo(x, y);
        } else {
            canvasCtx.lineTo(x, y);
        }
    }
    canvasCtx.stroke();
}