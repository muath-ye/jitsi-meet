// @flow

import { getToolbarButtons } from '../../../../base/config';
import { translate } from '../../../../base/i18n';
import { connect } from '../../../../base/redux';
import AbstractHighlightButton, {
    _mapStateToProps as _abstractMapStateToProps,
    type Props
} from '../AbstractHighlightButton';

/**
 * Button for highlighting a meeting moment.
 */
class HighlightButton extends AbstractHighlightButton<Props> {}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code HighlightButton} component.
 *
 * @param {Object} state - The Redux state.
 * @param {Props} ownProps - The own props of the Component.
 * @private
 * @returns {{
 *     visible: boolean
 * }}
 */
export function _mapStateToProps(state: Object, ownProps: Props): Object {
    const abstractProps = _abstractMapStateToProps(state, ownProps);
    const toolbarButtons = getToolbarButtons(state);
    let { visible } = ownProps;

    if (typeof visible === 'undefined') {
        visible = toolbarButtons.includes('highlight') && abstractProps.visible;
    }

    return {
        ...abstractProps,
        visible
    };
}

export default translate(connect(_mapStateToProps)(HighlightButton));
