// @flow

import {
    CONFERENCE_JOINED,
    CONFERENCE_WILL_LEAVE,
    getCurrentConference
} from '../base/conference';
import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import { MiddlewareRegistry } from '../base/redux';
import { TRACK_UPDATED, TRACK_ADDED, TRACK_REMOVED } from '../base/tracks';
import { changeTrack, resetTrack } from '../facial-recognition';
import { shouldDisplayTileView } from '../video-layout';
import { SET_TILE_VIEW } from '../video-layout/actionTypes';
import { VIRTUAL_BACKGROUND_TRACK_CHANGED } from '../virtual-background/actionTypes';

import { UPDATE_FACE_COORDINATES } from './actionTypes';
import {
    loadWorker,
    stopFaceRecognition,
    startFaceRecognition
} from './actions';
import { FACE_BOX_EVENT_TYPE } from './constants';

MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    const state = getState();
    const { faceCoordinatesSharing } = state['features/base/config'];
    const isInTileView = shouldDisplayTileView(state);

    if (!getCurrentConference(getState())) {
        return next(action);
    }

    if (action.type === CONFERENCE_JOINED) {
        if (faceCoordinatesSharing?.enabled) {
            dispatch(loadWorker());

            if (isInTileView) {
                dispatch(startFaceRecognition());
            }
        }

        // allow using remote face centering data when local face centering is not enabled
        action.conference.on(
            JitsiConferenceEvents.ENDPOINT_MESSAGE_RECEIVED,
            (...args) => {
                if (args && args.length >= 2) {
                    const [ { _id }, eventData ] = args;

                    if (eventData.type === FACE_BOX_EVENT_TYPE) {
                        dispatch({
                            type: UPDATE_FACE_COORDINATES,
                            faceBox: eventData.faceBox,
                            id: _id
                        });
                    }
                }
            });

        return next(action);
    }

    if (!faceCoordinatesSharing?.enabled) {
        return next(action);
    }

    // might need to change logic here if object-fit: cover will be used outside of tileview in the future
    if (action.type === SET_TILE_VIEW) {
        if (action.enabled) {
            dispatch(startFaceRecognition());
        } else {
            dispatch(stopFaceRecognition());
        }

        return next(action);
    }

    if (!isInTileView) {
        return next(action);
    }

    switch (action.type) {
    case CONFERENCE_WILL_LEAVE : {
        dispatch(stopFaceRecognition());

        return next(action);
    }
    case TRACK_UPDATED: {
        const { videoType, type } = action.track.jitsiTrack;

        if (videoType === 'camera') {
            const { muted, videoStarted } = action.track;

            if (videoStarted === true) {
                dispatch(startFaceRecognition());
            }
            if (muted !== undefined) {
                if (muted) {
                    dispatch(stopFaceRecognition());
                } else {
                    dispatch(startFaceRecognition());
                    type === 'presenter' && changeTrack(action.track);
                }
            }
        }

        return next(action);
    }
    case TRACK_ADDED: {
        const { mediaType, videoType } = action.track;

        if (mediaType === 'presenter' && videoType === 'camera') {
            dispatch(startFaceRecognition());
            changeTrack(action.track);
        }

        return next(action);
    }
    case TRACK_REMOVED: {
        const { videoType } = action.track.jitsiTrack;

        if ([ 'camera', 'desktop' ].includes(videoType)) {
            dispatch(stopFaceRecognition());
        }

        return next(action);
    }
    case VIRTUAL_BACKGROUND_TRACK_CHANGED: {
        dispatch(resetTrack());

        return next(action);
    }
    }

    return next(action);
});
