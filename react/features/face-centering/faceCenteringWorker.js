// @flow
import * as blazeface from '@tensorflow-models/blazeface';
import { setWasmPaths } from '@tensorflow/tfjs-backend-wasm';
import * as tf from '@tensorflow/tfjs-core';

import { FACE_BOX_MESSAGE, DETECT_FACE_BOX } from './constants';

/**
 * The blazeface model.
 */
let model;

/**
 * A flag that indicates whether the tensorflow backend is set or not.
 */
let backendSet = false;

/**
 * Contains the last valid face bounding box (passes threshold validation) which was sent to the main process.s.
 */
let lastValidFaceBox;

const detect = async message => {
    const { baseUrl, imageData, isHorizontallyFlipped, threshold } = message.data;

    if (!backendSet) {
        setWasmPaths(baseUrl);

        await tf.setBackend('wasm');
        backendSet = true;
    }

    // load face detection model
    if (!model) {
        model = await blazeface.load();
    }

    tf.engine().startScope();

    const image = tf.browser.fromPixels(imageData);
    const detections = await model.estimateFaces(image, false, isHorizontallyFlipped, false);

    tf.engine().endScope();

    let faceBox;

    if (detections.length) {
        faceBox = {
            // normalize to percentage based
            left: Math.round(Math.min(...detections.map(d => d.topLeft[0])) * 100 / imageData.width),
            right: Math.round(Math.max(...detections.map(d => d.bottomRight[0])) * 100 / imageData.width),
            top: Math.round(Math.min(...detections.map(d => d.topLeft[1])) * 100 / imageData.height),
            bottom: Math.round(Math.max(...detections.map(d => d.bottomRight[1])) * 100 / imageData.height)
        };

        if (lastValidFaceBox && Math.abs(lastValidFaceBox.left - faceBox.left) < threshold) {
            self.postMessage({
                type: FACE_BOX_MESSAGE,
                value: null
            });

            return;
        }

        lastValidFaceBox = faceBox;
    }

    self.postMessage({
        type: FACE_BOX_MESSAGE,
        value: faceBox
    });
};

onmessage = async function(message) {
    if (message.data.id === DETECT_FACE_BOX) {
        detect(message);
    }
};
