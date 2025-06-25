import React, {  useEffect, useState, useRef } from 'react';
import { Container, Button, Dropdown } from 'react-bootstrap';

export default function Main() {
    
    const [lpcOrder, setLpc] = useState(20)
    // NOTE: average female LPC is 9-11, average male LPC is 11-13. Notify users of this.
    // For this use case, 20 looks better, don't know why
    const [rec, setRec] = useState(false)
    const audioCtx = useRef(null)
    const analyzer = useRef(null)
    const mic = useRef(null)
    const node = useRef(null)
    const canvasRef = useRef(null)
    const ctxRef = useRef(null)
    const streamRef = useRef(null)

    // set canvas dimensions
    useEffect(() => {
       const canvas = canvasRef.current;
        const ctx    = canvas.getContext('2d');
        ctxRef.current = ctx;
        const resizeCanvas = () => {
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = canvas.parentElement.clientHeight;
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        return () =>
            window.removeEventListener('resize', resizeCanvas); // cleanup on unmoun
    }, [])

    // event listener for the start button
    const startButton = () => {
        rec ? stopCapture() : startCapture();
    };

    // start audio capture 
    const startCapture = async () => {
        try {
            // Initialize AudioContext
            audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();

            // Get audio stream from microphone
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            mic.current = audioCtx.current.createMediaStreamSource(stream);

            // Create an analyser node
            analyzer.current = audioCtx.current.createAnalyser();
            analyzer.current.fftSize = 2048;

            // Create a script processor node for custom processing
            node.current = audioCtx.current.createScriptProcessor(2048, 1, 1);
            node.current.onaudioprocess = processAudio;

            // Connect the nodes: microphone -> analyser -> javascriptNode -> destination
            mic.current.connect(analyzer.current);
            analyzer.current.connect(node.current);
            node.current.connect(audioCtx.current.destination);

            setRec(true);
        } catch (err) {
            console.log('Error accessing microphone: ' + err.message);
        }
    };

// stop audio capture
const stopCapture = () => {
    if (mic.current) {
        mic.current.disconnect();
        analyzer.current.disconnect();
        node.current.disconnect();
        audioCtx.current.close();
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
        }
        setRec(false);
        console.log('Audio capture stopped.');
    }
    
}

    // main audio processing function
    const processAudio = (e) => {
        const buffer = new Float32Array(analyzer.current.fftSize);
        analyzer.current.getFloatTimeDomainData(buffer);

        // apply the Hamming window
        const windowedBuffer = applyWindow(buffer);

        // LPC analysis
        const { a, err } = lpc(windowedBuffer, lpcOrder);
        if (a) {
            drawSpectralEnvelope(a);
            console.log('LPC analysis successful. Coefficients:', a);
        } else {
            console.log('No!!!! LPC failed: ', err);
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


    /**
     * Draws the spectral envelope on the canvas, scaled to 0-5000Hz.
     * Also adds frequency labels to the X-axis.
     * @param {Float32Array} lpcCoefficients The LPC coefficients.
     */
    function drawSpectralEnvelope(lpcCoefficients) {
        if (!audioCtx.current) return;
        const ctx = ctxRef.current;
        const canvas = ctx.canvas;
        const sr = audioCtx.current.sampleRate;

        ctx.fillStyle = '#1a202c';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const maxFreq = 5000;
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#374151';
        ctx.fillStyle = '#9ca3af';
        ctx.font = '12px Inter';
        const numGridLines = 5;
        for (let i = 0; i <= numGridLines; i++) {
            const freq = (maxFreq / numGridLines) * i;
            const x = (freq / maxFreq) * canvas.width;
            if (i > 0) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height - 20);
                ctx.stroke();
            }
            const label = `${freq / 1000}k`;
            ctx.fillText(label, x - (i === 0 ? 0 : 10), canvas.height - 5);
        }

        // --- Calculate and Draw LPC Curve in dB ---
        ctx.strokeStyle = '#4299e1';
        ctx.lineWidth = 2;
        ctx.beginPath();

        const numPoints = canvas.width;
        const freqResponse = new Float32Array(numPoints);
        let maxDb = -Infinity, minDb = Infinity;

        for (let i = 0; i < numPoints; i++) {
            const freq = (i / numPoints) * maxFreq;
            const w = 2 * Math.PI * freq / sr;
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
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();

        // draw the vertical bounds for F1/F2 formants
        const a_f1_range = [638, 657];
        const a_f2_range = [1215, 1353];
        const f1_start = (a_f1_range[0] / maxFreq) * canvas.width;
        const f1_end = (a_f1_range[1] / maxFreq) * canvas.width;
        const f2_start = (a_f2_range[0] / maxFreq) * canvas.width;
        const f2_end = (a_f2_range[1] / maxFreq) * canvas.width;
        ctx.strokeStyle = '#f56565';
        //draw a transparent rectangle for F1
        ctx.fillStyle = 'rgba(245, 101, 101, 0.2)';
        ctx.fillRect(f1_start, 0, f1_end - f1_start, canvas.height - 20);
        ctx.strokeRect(f1_start, 0, f1_end - f1_start, canvas.height - 20);
        //draw a transparent rectangle for F2
        ctx.fillStyle = 'rgba(245, 101, 101, 0.2)';
        ctx.fillRect(f2_start, 0, f2_end - f2_start, canvas.height - 20);
        ctx.strokeRect(f2_start, 0, f2_end - f2_start, canvas.height - 20);
    }

    return (
        <Container className="main">
            <h1 className="header">LPC Analysis</h1>
            <div className="canvas-container">
                <canvas ref={canvasRef} className="canvas" />
            </div>
            <div className="controls">
                <Button variant="primary" onClick={startButton}>
                    {rec ? 'Stop' : 'Start'} Capture Audio
                </Button>
            </div>
            <div className="lpc-order">
                <label htmlFor="lpcOrder">LPC Order:</label>
                <input
                    type="number"
                    id="lpcOrder"
                    value={lpcOrder}
                    onChange={(e) => setLpc(e.target.value)}
                    min="1"
                    max="30"
                />                
            </div>

        </Container>
    )
}