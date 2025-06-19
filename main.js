// ...existing code moved from <script>...</script> in main.html...
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
        javascriptNode = audioContext.createScriptProcessor(1024, 1, 1);
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
    // Clear canvas
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
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
        windowed[i] = buffer[i] * (0.54 - 0.46 * Math.cos(2 * Math.PI * i / (N - 1)));
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
 * Draws the spectral envelope on the canvas.
 * @param {Float32Array} lpcCoefficients The LPC coefficients.
 */
function drawSpectralEnvelope(lpcCoefficients) {
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    canvasCtx.strokeStyle = '#4299e1'; // Blue color
    canvasCtx.lineWidth = 2;
    canvasCtx.beginPath();
    
    const numPoints = canvas.width;
    const freqResponse = new Float32Array(numPoints);
    let maxVal = 0.0001; // To avoid division by zero and initialize max

    for (let i = 0; i < numPoints; i++) {
        const w = (Math.PI * i) / numPoints;
        let re = 1.0, im = 0.0;
        for (let k = 1; k < lpcCoefficients.length; k++) {
            re += lpcCoefficients[k] * Math.cos(k * w);
            im += lpcCoefficients[k] * Math.sin(k * w);
        }
        const val = 1.0 / Math.sqrt(re * re + im * im);
        freqResponse[i] = val;
        if(val > maxVal) maxVal = val;
    }

    for (let i = 0; i < numPoints; i++) {
        const x = i;
        // Normalize and scale to canvas height
        const y = canvas.height - (freqResponse[i] / maxVal * canvas.height * 0.9) - (canvas.height * 0.05) ;

        if (i === 0) {
            canvasCtx.moveTo(x, y);
        } else {
            canvasCtx.lineTo(x, y);
        }
    }
    canvasCtx.stroke();

    
    // Draw x-axis with frequency labels
    canvasCtx.strokeStyle = '#fff';
    canvasCtx.lineWidth = 1;
    canvasCtx.beginPath();
    // Draw axis line
    canvasCtx.moveTo(0, canvas.height - 1);
    canvasCtx.lineTo(canvas.width, canvas.height - 1);
    canvasCtx.stroke();

    // Draw frequency ticks and labels
    const sampleRate = audioContext ? audioContext.sampleRate : 44100;
    const nyquist = sampleRate / 2;
    const numTicks = 10;
    canvasCtx.fillStyle = '#888';
    canvasCtx.font = '12px sans-serif';
    canvasCtx.textAlign = 'center';
    for (let i = 0; i <= numTicks; i++) {
        const x = (i / numTicks) * canvas.width;
        const freq = Math.round((i / numTicks) * nyquist);
        // Tick
        canvasCtx.beginPath();
        canvasCtx.moveTo(x, canvas.height - 1);
        canvasCtx.lineTo(x, canvas.height - 8);
        canvasCtx.stroke();
        // Label
        canvasCtx.fillText(freq + ' Hz', x, canvas.height - 12);
    }

}