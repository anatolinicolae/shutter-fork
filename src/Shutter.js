import Adapter from 'webrtc-adapter';


class Shutter {

  // The only necesary parameter is an id of the video element to use
  constructor(options) {
    this.logging = options.logging || false;
    this.stream = null;
    // The options can just be a string and it'll use all the defaults
    this.selector = typeof options === 'string' ? options : options.selector;

    this.width = options.width || 640;
    this.height = options.height || 480;

    this.mimeType = options.mimeType || 'video/webm';

    if (!this.isTypeSupported(this.mimeType)) {
      this.error('This browser does not support the mimeType "', this.mimeType, '"');
    }

    this.stream = null;
    this.mediaRecorder = null;
    this.chunks = [];

    if (!location.protocol === 'https:' && location.host !== 'localhost') {
      this.error('Webcam videos are not allowed on insecure origins. Please use HTTPS');
    }

    this.video = document.querySelector('video' + this.selector);

    if (!this.video) {
      this.error('No video element found');
    }

    this.video.setAttribute('autoplay', true);
    this.video.setAttribute('muted', true);
    this.log('Created Recorder');
  }

  getUserMedia(callback) {
    // There are the optional constraints but those are very unpredictable
    const constraints = {
      video: { width: this.width, height: this.height },
      audio: true,
    };
    return navigator.mediaDevices.getUserMedia(constraints)
      .then((mediaStream) => {
        this.log('Webcam hooked up');
        // We can't pass this in as a handler because then the handleStream would lose the lexical
        // scope of this
        this.handleStream(mediaStream);
        return mediaStream;
      })
      .catch(() => {
        this.getUserMediaError();
      });
  }

  isReadyToRecord() {
    return !! this.stream;
  }

  // Private method called to handle hte media stream once permission has been granted by the user
  handleStream(mediaStream) {
    this.video.src = window.URL.createObjectURL(mediaStream);
    this.stream = mediaStream;
    const options = { mimeType: this.mimeType };
    this.mediaRecorder = new MediaRecorder(this.stream, options);

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.chunks.push(event.data);
      }
    };

    this.mediaRecorder.onerror = (error) => {
      this.error(error);
    };
    this.mediaRecorder.onpause = () => {};
    this.mediaRecorder.onresume = () => {};
    this.mediaRecorder.onstart = () => {};
    this.mediaRecorder.onstop = () => {

    };
    this.mediaRecorder.onwarning = (warning) => {
      this.error(warning);
    };
  }

  getState() {
    if (!this.mediaRecorder) {
      return 'inactive';
    }
    return this.mediaRecorder.state;
  }

  getUserMediaError(error) {
    this.error(error);
  }

  start() {
    this.mediaRecorder.start(10);
    this.log('Recording Started');
  }

  stop(callback) {
    this.mediaRecorder.stop();
    this.blob = new Blob(this.chunks, { type: this.mimeType });
    this.log('Recording Finished');
    const fileSize = (this.blob.size / 1048576).toFixed(3) + 'mb';
    this.log('File Size: ' + fileSize);
    if (callback && typeof(callback) === 'function') {
      callback(this.getLinkToFile());
    }
  }

  getLinkToFile() {
    return window.URL.createObjectURL(this.blob);
  }


  isTypeSupported(type) {
    // I think firefox has different method for this idk?
    /* global no-undef  MediaRecorder */
    return MediaRecorder.isTypeSupported(type);
  }

  getTypesSupported() {
    const chromeTypes = ['video/webm',
                          'audio/webm',
                          'video/webm;codecs=vp8',
                          'video/webm;codecs=vp9'];
    return chromeTypes;
  }

  error(message) {
    console.log('Recorder Error: ', message);
  }

  log(message) {
    if (this.logging) {
      console.log(message);
    }
  }

}

module.exports = Shutter;

