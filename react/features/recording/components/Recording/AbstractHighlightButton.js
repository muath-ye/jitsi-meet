// @flow

import {
    createToolbarEvent,
    sendAnalytics
} from '../../../analytics';
import { IconHighlight } from '../../../base/icons';
import { JitsiRecordingConstants } from '../../../base/lib-jitsi-meet';
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox/components';
import { highlightMeetingMoment } from '../../actions.any';
import { getActiveSession, isHighlightMeetingMomentDisabled } from '../../functions';

/**
 * The type of the React {@code Component} props of
 * {@link AbstractHighlightButton}.
 */
export type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function,

    /**
     * The i18n translate function.
     */
    t: Function
};

/**
 * An abstract implementation of a button for highlighting meeting moments.
 */
export default class AbstractHighlightButton<P: Props> extends AbstractButton<P, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.highlight';
    icon = IconHighlight;
    label = 'toolbar.highlight';
    toggledLabel = 'toolbar.highlight';

    /**
     * Helper function to be implemented by subclasses, which must return a
     * boolean value indicating if this button is disabled or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isDisabled() {
        return this.props._disabled;
    }

    /**
     * Handles clicking / pressing the button.
     *
     * @override
     * @protected
     * @returns {void}
     */
    async _handleClick() {
        const { dispatch } = this.props;

        dispatch(highlightMeetingMoment());

        sendAnalytics(createToolbarEvent('highlight.button'));
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code HighlightButton} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     visible: boolean
 * }}
 */
export function _mapStateToProps(state: Object): Object {
    const isRecordingRunning = getActiveSession(state, JitsiRecordingConstants.mode.FILE);
    const isButtonDisabled = isHighlightMeetingMomentDisabled(state);
    const { webhookProxyUrl } = state['features/base/config'];

    return {
        _disabled: !isRecordingRunning || isButtonDisabled,
        visible: Boolean(webhookProxyUrl)
    };
}
