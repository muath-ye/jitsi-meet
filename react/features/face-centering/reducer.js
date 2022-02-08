// @flow

import { ReducerRegistry } from '../base/redux';

import {
    START_FACE_RECOGNITION,
    STOP_FACE_RECOGNITION,
    UPDATE_FACE_COORDINATES
} from './actionTypes';

const defaultState = {
    faceBoxes: {},
    recognitionActive: false
};

ReducerRegistry.register('features/face-centering', (state = defaultState, action) => {
    switch (action.type) {
    case UPDATE_FACE_COORDINATES: {
        return {
            ...state,
            faceBoxes: {
                ...state.faceBoxes,
                [action.id]: action.faceBox
            }
        };
    }
    case START_FACE_RECOGNITION: {
        return {
            ...state,
            recognitionActive: true
        };
    }

    case STOP_FACE_RECOGNITION: {
        return defaultState;
    }
    }

    return state;
});
