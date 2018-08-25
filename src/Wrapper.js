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
          currentValue: this.props.value,               //current value
          isRequired: this.props.isRequired,                  //whether input is required
          isValid: true,                                      //whether the current value passed all validations
          pristineValue: this.props.value,                    //pristine value
          validationError: this.props.validationError,        //default validation error message if one is not defined in validationErrors
          validationErrors: this.props.validationErrors,      //validationErrors, maps validations to error messages
          validationErrorsMessages: [],                       //error messages for currently failing validations
          externalError: null,                                //whether there is an external validation error passed in as a prop
          formSubmitted: false,                               //whether the current value has been submitted with the rest of the form
          parsedValidations: null,                            //validations converted to objects used in runtime
          parsedRequiredValidations: null,                    //required validations converted to objects used in runtime
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
        !isSame(nextProps.currentValue, this.props.currentValue) ||
        nextProps.isFormDisabled != this.props.isFormDisabled ||
        nextProps.isFormSubmitted != this.props.isFormSubmitted;
    }

    componentDidUpdate(prevProps) {
      ReactDOM.unstable_batchedUpdates(() => {
        // If validations or required is changed, run a new validation
        if (!isSame(this.props.validations, prevProps.validations) ,
          !isSame(this.props.required, prevProps.required)) {

          this.setValidations(this.props.validations, this.props.required);
        }

        // allow value prop change to update the state
        //if (typeof this.props.value != 'undefined' && typeof prevProps.value == 'undefined') {
        if (!isSame(this.props.value, prevProps.value)) {
          this.setValue(this.props.value);
        }
      });
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

    render() {
      const propsForElement = {
        ...this.props,
        errorMessage: this.getErrorMessage(),
        errorMessages: this.getErrorMessages(),
        hasValue: !!this.props.currentValue,
        isFormDisabled: this.props.isFormDisabled,
        isFormSubmitted: this.props.formSubmitted,
        isRequired: !!this.props.required,
        isPristine: this.props.currentValue === this.props.pristineValue,
        isValid: this.props.isValid,
        isValidValue: this.isValidValue,
        resetValue: this.resetValue,
        setValidations: this.setValidations,
        setValue: this.setValue,
        showError: this.showError(),
        showRequired: this.props.isRequired,
        value: this.props.currentValue || this.props.value,
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
