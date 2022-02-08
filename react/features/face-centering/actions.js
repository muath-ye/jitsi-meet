// @flow
import 'image-capture';

import { getCurrentConference } from '../base/conference';
import { getLocalParticipant, getParticipantCount } from '../base/participants';
import { getLocalVideoTrack } from '../base/tracks';
import '../facial-recognition/createImageBitmap';
import { getAppBaseUrl } from '../facial-recognition/functions';

import {
    START_FACE_RECOGNITION,
    STOP_FACE_RECOGNITION,
    UPDATE_FACE_COORDINATES
} from './actionTypes';
import {
    FACE_BOX_MESSAGE,
    SEND_IMAGE_INTERVAL_MS
} from './constants';
import { sendDataToWorker, sendFaceBoxToParticipants } from './functions';
import logger from './logger';

/**
 * Interval object for sending new image data to worker.
 */
let interval;

/**
 * Object containing  a image capture of the local track.
 */
let imageCapture;

/**
 * Object where the face centering worker is stored.
 */
let worker;

/**
 * Loads the worker.
 *
 * @returns {void}
 */
export function loadWorker() {
    return async function(dispatch: Function, getState: Function) {
        if (!window.Worker) {
            logger.warn('Browser does not support web workers');

            return;
        }

        const baseUrl = getAppBaseUrl();
        let workerUrl = `${baseUrl}face-centering-worker.min.js`;

        const workerBlob = new Blob([ `importScripts("${workerUrl}");` ], { type: 'application/javascript' });

        workerUrl = window.URL.createObjectURL(workerBlob);
        worker = new Worker(workerUrl, { name: 'Face Centering Worker' });
        worker.onmessage = function(e: Object) {
            const { type, value } = e.data;

            // receives a message with the face(s) bounding box.
            if (type === FACE_BOX_MESSAGE) {
                if (!value) {
                    return;
                }

                const state = getState();
                const conference = getCurrentConference(state);
                const localParticipant = getLocalParticipant(state);

                if (getParticipantCount(state) > 1) {
                    sendFaceBoxToParticipants(conference, value);
                }

                dispatch({
                    type: UPDATE_FACE_COORDINATES,
                    faceBox: value,
                    id: localParticipant.id
                });
            }
        };
    };
}

/**
 * Starts the recognition and detection of face position.
 *
 * @param  {Object} stream - Video stream.
 * @returns {Function}
 */
export function startFaceRecognition() {
    return async function(dispatch: Function, getState: Function) {
        if (worker === undefined || worker === null) {
            return;
        }
        const state = getState();
        const { recognitionActive } = state['features/face-centering'];

        if (recognitionActive) {
            return;
        }

        const localVideoTrack = getLocalVideoTrack(state['features/base/tracks']);

        if (!localVideoTrack) {
            return;
        }

        const stream = localVideoTrack.jitsiTrack.getOriginalStream();

        if (!stream) {
            return;
        }

        dispatch({ type: START_FACE_RECOGNITION });
        logger.log('Start face recognition');

        const firstVideoTrack = stream.getVideoTracks()[0];

        // $FlowFixMe
        imageCapture = new ImageCapture(firstVideoTrack);
        const { disableLocalVideoFlip, faceCoordinatesSharing } = state['features/base/config'];

        interval = setInterval(() => {
            sendDataToWorker(worker, imageCapture, faceCoordinatesSharing?.threshold, !disableLocalVideoFlip);
        }, faceCoordinatesSharing?.captureInterval || SEND_IMAGE_INTERVAL_MS);
    };
}

/**
 * Stops the recognition and detection of face position.
 *
 * @returns {void}
 */
export function stopFaceRecognition() {
    return function(dispatch: Function) {
        clearInterval(interval);
        interval = null;
        imageCapture = null;

        dispatch({ type: STOP_FACE_RECOGNITION });
        logger.log('Stop face recognition');
    };
}
