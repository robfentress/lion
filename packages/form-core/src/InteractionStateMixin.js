import { dedupeMixin } from '@lion/core';
import { FormControlMixin } from './FormControlMixin.js';

/**
 * @desc `InteractionStateMixin` adds meta information about touched and dirty states, that can
 * be read by other form components (ing-uic-input-error for instance, uses the touched state
 * to determine whether an error message needs to be shown).
 * Interaction states will be set when a user:
 * - leaves a form field(blur) -> 'touched' will be set to true. 'prefilled' when a
 *   field is left non-empty
 * - on keyup (actually, on the model-value-changed event) -> 'dirty' will be set to true
 * @param {HTMLElement} superclass
 */
export const InteractionStateMixin = dedupeMixin(
  superclass =>
    // eslint-disable-next-line no-unused-vars, no-shadow
    class InteractionStateMixin extends FormControlMixin(superclass) {
      static get properties() {
        return {
          /**
           * True when user has focused and left(blurred) the field.
           */
          touched: {
            type: Boolean,
            reflect: true,
          },
          /**
           * True when user has changed the value of the field.
           */
          dirty: {
            type: Boolean,
            reflect: true,
          },
          /**
           * True when the modelValue is non-empty (see _isEmpty in FormControlMixin)
           */
          filled: {
            type: Boolean,
            reflect: true,
          },
          /**
           * True when user has left non-empty field or input is prefilled.
           * The name must be seen from the point of view of the input field:
           * once the user enters the input field, the value is non-empty.
           */
          prefilled: {
            type: Boolean,
          },
          /**
           * True when user has attempted to submit the form, e.g. through a button
           * of type="submit"
           */
          submitted: {
            type: Boolean,
          },
        };
      }

      _requestUpdate(name, oldVal) {
        super._requestUpdate(name, oldVal);
        if (name === 'touched' && this.touched !== oldVal) {
          this._onTouchedChanged();
        }

        if (name === 'modelValue') {
          // We do this in _requestUpdate because we don't want to fire another re-render (e.g. when doing this in updated)
          // Furthermore, we cannot do it on model-value-changed event because it isn't fired initially.
          this.filled = !this._isEmpty();
        }

        if (name === 'dirty' && this.dirty !== oldVal) {
          this._onDirtyChanged();
        }
      }

      constructor() {
        super();
        this.touched = false;
        this.dirty = false;
        this.prefilled = false;
        this.filled = false;
        this._leaveEvent = 'blur';
        this._valueChangedEvent = 'model-value-changed';
        this._iStateOnLeave = this._iStateOnLeave.bind(this);
        this._iStateOnValueChange = this._iStateOnValueChange.bind(this);
      }

      /**
       * Register event handlers and validate prefilled inputs
       */
      connectedCallback() {
        if (super.connectedCallback) {
          super.connectedCallback();
        }
        this.addEventListener(this._leaveEvent, this._iStateOnLeave);
        this.addEventListener(this._valueChangedEvent, this._iStateOnValueChange);
        this.initInteractionState();
      }

      disconnectedCallback() {
        if (super.disconnectedCallback) {
          super.disconnectedCallback();
        }
        this.removeEventListener(this._leaveEvent, this._iStateOnLeave);
        this.removeEventListener(this._valueChangedEvent, this._iStateOnValueChange);
      }

      /**
       * Evaluations performed on connectedCallback. Since some components can be out of sync
       * (due to interdependence on light children that can only be processed
       * after connectedCallback and affect the initial value).
       * This method is exposed, so it can be called after they are initialized themselves.
       * Since this method will be called twice in last mentioned scenario, it must stay idempotent.
       */
      initInteractionState() {
        this.dirty = false;
        this.prefilled = !this._isEmpty();
      }

      /**
       * Sets touched value to true
       * Reevaluates prefilled state.
       * When false, on next interaction, user will start with a clean state.
       * @protected
       */
      _iStateOnLeave() {
        this.touched = true;
        this.prefilled = !this._isEmpty();
      }

      /**
       * Sets dirty value and validates when already touched or invalid
       * @protected
       */
      _iStateOnValueChange() {
        this.dirty = true;
      }

      /**
       * Resets touched and dirty, and recomputes prefilled
       */
      resetInteractionState() {
        this.touched = false;
        this.submitted = false;
        this.dirty = false;
        this.prefilled = !this._isEmpty();
      }

      _onTouchedChanged() {
        this.dispatchEvent(new CustomEvent('touched-changed', { bubbles: true, composed: true }));
      }

      _onDirtyChanged() {
        this.dispatchEvent(new CustomEvent('dirty-changed', { bubbles: true, composed: true }));
      }
    },
);
