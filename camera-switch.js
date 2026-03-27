/**
 * camera-switch.js
 * Enumerates available video input devices and provides a function to
 * switch the active camera without stopping the MediaPipe hands pipeline.
 *
 * Usage (called from index.html after the camera is running):
 *   await CameraSwitch.init(videoElement, onStreamReady);
 *   CameraSwitch.buildUI(containerElement);
 */

const CameraSwitch = (() => {
  let _vid = null;
  let _onStreamReady = null; // callback(stream) so the caller can restart Camera
  let _currentDeviceId = null;
  let _devices = [];

  /** Populate _devices with video input devices. */
  async function _enumerate() {
    // A brief getUserMedia is needed on some browsers before labels are exposed.
    const all = await navigator.mediaDevices.enumerateDevices();
    _devices = all.filter(d => d.kind === 'videoinput');
    return _devices;
  }

  /**
   * Switch to the camera identified by deviceId.
   * Stops the current stream, starts the new one, then calls _onStreamReady.
   */
  async function switchTo(deviceId) {
    if (!_vid) throw new Error('CameraSwitch: call init() first');
    if (deviceId === _currentDeviceId) return;

    // Stop existing tracks
    if (_vid.srcObject) {
      _vid.srcObject.getTracks().forEach(t => t.stop());
      _vid.srcObject = null;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId }, width: 640, height: 480 },
    });

    _vid.srcObject = stream;
    await _vid.play();
    _currentDeviceId = deviceId;

    if (typeof _onStreamReady === 'function') {
      _onStreamReady(stream);
    }
  }

  /**
   * Must be called once the video element exists (before or after camera starts).
   * @param {HTMLVideoElement} videoEl
   * @param {function} onStreamReady  - called with the new MediaStream after each switch
   */
  async function init(videoEl, onStreamReady) {
    _vid = videoEl;
    _onStreamReady = onStreamReady;
    await _enumerate();

    // Track whichever device is already active (if any)
    if (videoEl.srcObject) {
      const track = videoEl.srcObject.getVideoTracks()[0];
      _currentDeviceId = track?.getSettings()?.deviceId ?? null;
    }

    return _devices;
  }

  /**
   * Injects a <select> camera-picker into the given container element.
   * Call this after init() so device labels are available.
   * @param {HTMLElement} container
   */
  function buildUI(container) {
    if (_devices.length < 2) return; // nothing to switch

    const sel = document.createElement('select');
    sel.id = 'cameraPicker';
    sel.title = 'Switch camera';
    sel.style.cssText = [
      'background:rgba(255,255,255,0.1)',
      'border:0.5px solid rgba(255,255,255,0.22)',
      'color:#fff',
      'padding:6px 10px',
      'border-radius:8px',
      'font-size:13px',
      'cursor:pointer',
    ].join(';');

    _devices.forEach((d, i) => {
      const opt = document.createElement('option');
      opt.value = d.deviceId;
      opt.textContent = d.label || `Camera ${i + 1}`;
      if (d.deviceId === _currentDeviceId) opt.selected = true;
      sel.appendChild(opt);
    });

    sel.addEventListener('change', async () => {
      sel.disabled = true;
      try {
        await switchTo(sel.value);
      } catch (e) {
        console.error('CameraSwitch: failed to switch', e);
      } finally {
        sel.disabled = false;
      }
    });

    container.appendChild(sel);
  }

  return { init, switchTo, buildUI };
})();
