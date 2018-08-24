import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';
import {isSame} from './utils';

/* eslint-disable react/default-props-match-prop-types */

const propTypes = {
  name: PropTypes.string.isRequired,
  required: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object,
    PropTypes.string,
  ]),
  validations: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.string,
  ]),
  value: PropTypes.any, // eslint-disable-line react/forbid-prop-types
  formsy: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
};

export {
  propTypes,
};

export default Component => {
  class WrappedComponent extends React.Component {
    componentWillMount() {
      if (!this.props.name) {
        throw new Error('Form field requires a name property when used');
      }
    }

    componentDidMount() {
      ReactDOM.unstable_batchedUpdates(() => {
        this.props.formsy.addStateToForm(this.props.name, {
          value: this.props.value,
          isRequired: this.props.isRequired,
          isValid: true,
          pristineValue: this.props.value,
          validationError: this.props.validationError,
          validationErrors: this.props.validationErrors,
          validationErrorsMessages: [],
          externalError: null,
          formSubmitted: false,
        });

        this.setValidations(this.props.validations, this.props.required);
      });
    }

    // We have to make sure the validate method is kept when new props are added
    /*componentWillUpdate(nextvalProps) {
      if (!isSame(nextProps.validations, this.props.validations) ,
        !isSame(nextProps.required, this.props.required)) {
        this.setValidations(nextProps.validations, nextProps.required);
      }
    }*/

    shouldComponentUpdate(nextProps) {
      return !isSame(nextProps.validations, this.props.validations) ||
        !isSame(nextProps.required, this.props.required) ||
        nextProps.name != this.props.name ||
        nextProps.isValid != this.props.isValid ||
        nextProps.isRequired != this.props.isRequired ||
        nextProps.externalError != this.props.externalError ||
        !isSame(nextProps.validationError, this.props.validationError) ||
        !isSame(nextProps.value, this.props.value) ||
        nextProps.isFormDisabled != this.props.isFormDisabled ||
        nextProps.isFormSubmitted != this.props.isFormSubmitted;
    }

    componentDidUpdate(prevProps) {
      // If validations or required is changed, run a new validation
      if (!isSame(this.props.validations, prevProps.validations) ,
        !isSame(this.props.required, prevProps.required)) {

        this.setValidations(this.props.validations, this.props.required);
      }
    }

    // Detach it when component unmounts
    componentWillUnmount() {
      this.props.formsy.removeStateFromForm(this.props.name);
    }

    getErrorMessage = () => {
      const messages = this.getErrorMessages();

      return messages.length ? messages[0] : null;
    }

    getErrorMessages = () => {
      if (!this.props.isValid || this.props.isRequired) {
        return this.props.externalError || this.props.validationErrorMessages || [];
      }

      return [];
    }

    setValidations = (validations, required) => {
      this.props.formsy.setValidations(this.props.name, validations, required);
    };

    // By default, we validate after the value has been set.
    // A user can override this and pass a second parameter of `false` to skip validation.
    setValue = (value, validate = true) => {
      this.props.formsy.setValue(this.props.name, value, validate);
    }

    isValidValue = value =>
      this.props.formsy.isValidValue(this.props.name, value);

    resetValue = () => {
      this.props.formsy.resetValue(this.props.name);
    }

    showError = () => !this.props.isRequired && !this.props.isValid;

    isPristine = () => this.props.value === this.props.pristineValue;

    render() {
      const propsForElement = {
        ...this.props,
        errorMessage: this.getErrorMessage(),
        errorMessages: this.getErrorMessages(),
        hasValue: !!this.props.value,
        isFormDisabled: this.props.isFormDisabled,
        isFormSubmitted: this.props.formSubmitted,
        isRequired: this.props.required,
        isPristine: this.isPristine(),
        isValid: this.props.isValid,
        isValidValue: this.isValidValue,
        resetValue: this.resetValue,
        setValidations: this.setValidations,
        setValue: this.setValue,
        showError: this.showError(),
        showRequired: this.props.isRequired,
        value: this.props.value,
      };

      return <Component {...propsForElement} />;
    }
  }

  function getDisplayName(component) {
    return (
      component.displayName ,
      component.name ,
      (typeof component === 'string' ? component : 'Component')
    );
  }

  WrappedComponent.displayName = `Formsy(${getDisplayName(Component)})`;

  WrappedComponent.defaultProps = {
    required: false,
    validationError: '',
    validationErrors: {},
    validations: null,
    value: Component.defaultValue,
  };

  WrappedComponent.propTypes = propTypes;

  return WrappedComponent;
};
