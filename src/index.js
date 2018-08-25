import formDataToObject from 'form-data-to-object';
import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';

import {runRules, isSame, convertValidationsToObject} from './utils';
import validationRules from './validationRules';
import Wrapper, { propTypes } from './Wrapper';

/* eslint-disable react/default-props-match-prop-types */

const initialState = {
  inputs: {},
};

function mapInputState(state, callback) {
  const newState = {};

  Object.keys(state.inputs).forEach(name => {
    newState[name] = callback(state.inputs[name], name);
  });

  return newState;
}

class Formsy extends React.Component {
    constructor(props) {

    super(props);

    //no need to be in state, they don't affect rendering
    this.isValid = true;
    this.canChange = false;
    this._isMounted = false;

    //references to children, should aim to remove this
    this.inputs = [];

    //using this to batch input state updates
    //instead of setting state evrey time an input mounts
    //we add its state here
    //then do one setState for the form in its CDM
    this.preMountInputState = {};

    this.state = initialState;

    this.methodsToPassToChildren = {
      addStateToForm: this.addStateToForm,
      removeStateFromForm: this.removeStateFromForm,
      validate: this.validate,
      isValidValue: (name, value) => this.runValidation(this.state.inputs[name], name, value).isValid,
      setValue: this.setValue,
      resetValue: this.resetValue,
      setValidations: this.setValidations,
    };
  }

  static getDerivedStateFromProps(props, state) {
    //set validation errors in state if provided through props
    if (props.validationErrors && typeof props.validationErrors === 'object' && Object.keys(props.validationErrors).length > 0) {
      return {
        inputs: mapInputState(state.inputs, (input, name) => ({
          ...input,
          isValid: !(name in errors),
          validationErrorMessages: typeof errors[name] === 'string' ? [errors[name]] : errors[name],
        })),
      };
    }

    return null;
  }

  componentDidMount() {
    this._isMounted = true;

    ReactDOM.unstable_batchedUpdates(() => {
      this.setState({
        inputs: this.preMountInputState,
      });
    });
  }

  componentDidUpdate(prevProps, prevState) {
    const inputNames = Object.keys(this.state.inputs);

    if (inputNames.length != Object.keys(prevState.inputs).length || inputNames.some(name => !isSame(this.state.inputs[name].currentValue, prevState.inputs[name].currentValue))) {
      this.validateForm();
    }
  }

  mapInputState = (callback) => mapInputState(this.state, callback);

  getCurrentValues = () => Object.keys(this.state.inputs).map(input => input.currentValue);

  getModel = () => this.mapModel(this.getCurrentValues());

  getPristineValues = () => Object.keys(this.state.inputs).map(input => input.pristineValue);

  setFormPristine = isPristine => {
    this.setState(prevState => ({
      formSubmitted: !isPristine,
      inputs: mapInputState(prevState, input => ({
        ...input,
        formSubmitted: !isPristine,
      })),
    }));
  };

  setInputValidationErrors = errors => {
    this.setState(prevState => ({
      inputs: mapInputState(prevState, (input, name) => ({
        ...input,
        isValid: !(name in errors),
        validationError: typeof errors[name] === 'string' ? [errors[name]] : errors[name],
      })),
    }));
  };

  mapModel = model => {
    if (this.props.mapping) {
      return this.props.mapping(model);
    }

    return formDataToObject.toObj(Object.keys(model).reduce((mappedModel, key) => {
      const keyArray = key.split('.');
      let base = mappedModel;
      while (keyArray.length) {
        const currentKey = keyArray.shift();
        base[currentKey] = (keyArray.length ? base[currentKey] || {} : model[key]);
        base = base[currentKey];
      }
      return mappedModel;
    }, {}));
  };

  reset = data => {
    this.setState({
      inputs: initialState.inputs,
    });

    this.setFormPristine(true);

    this.resetModel(data);
  };

  resetInternal = event => {
    event.preventDefault();

    this.reset();

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  // Reset each key in the model to the original / initial / specified value
  resetModel = data => {
    this.setState(prevState => ({
      inputs: mapInputState(prevState, (input, name) => ({
        ...input,
        currentValue: name in data ? data[name] : input.pristineValue,
      })),
    }));

    this.validateForm();
  };

  // Checks validation on current value or a passed value
  runValidation = (input, name, value = input.currentValue) => {
    const currentValues = this.getCurrentValues();

    const {
      validationError,
      validationErrors,
    } = input;

    const validationResults = runRules(
      value,
      currentValues,
      input.parsedValidations,
      validationRules,
    );

    const requiredResults = runRules(
      value,
      currentValues,
      input.parsedRequiredValidations,
      validationRules,
    );

    const isRequired = Object.keys(input.parsedRequiredValidations).length ?
      !!requiredResults.success.length : false;

    const isValid = !validationResults.failed.length &&
      !(this.props.validationErrors && this.props.validationErrors[name]);

    return {
      isRequired,
      isValid: isRequired ? false : isValid,
      error: (() => {
        if (isValid && !isRequired) {
          return [];
        }

        if (validationResults.errors.length) {
          return validationResults.errors;
        }

        if (this.props.validationErrors && this.props.validationErrors[name]) {
          return typeof this.props.validationErrors[name] === 'string' ? [this.props.validationErrors[name]] : this.props.validationErrors[name];
        }

        if (isRequired) {
          const error = validationErrors[requiredResults.success[0]];
          return error ? [error] : null;
        }

        if (validationResults.failed.length) {
          return validationResults.failed.map(failed =>
            (validationErrors[failed] ? validationErrors[failed] : validationError))
            .filter((x, pos, arr) => arr.indexOf(x) === pos); // remove duplicates
        }

        return undefined;
      })(),
    };
  };

  addStateToForm = (name, state) => {
    // if it's mounted we are free to set state
    if (this._isMounted) {
      this.setState({
        inputs: {
          ...this.state.inputs,
          [name]: state,
        },
      });
    // if not mounted then it's the first render
    // we batch state updates to minimize rerenders
    } else {
      this.preMountInputState[name] = state;
    }

    return this._isMounted;
  };

  removeStateFromForm = name => {
    const newState = {...this.inputs.state};

    delete newState[name];

    this.setState({
      inputs: newState,
    }, this.validateForm);
  };

  // Checks if the values have changed from their initial value
  isChanged = () => !isSame(this.getPristineValues(), this.getCurrentValues());

  // Update model, submit to url prop and send the model
  submit = event => {
    if (event && event.preventDefault) {
      event.preventDefault();
    }

    // Trigger form as not pristine.
    // If any inputs have not been touched yet this will make them dirty
    // so validation becomes visible (if based on isPristine)
    this.setFormPristine(false);
    const model = this.getModel();
    this.props.onSubmit(model, this.resetModel, this.updateInputsWithError);
    if (this.isValid) {
      this.props.onValidSubmit(model, this.resetModel, this.updateInputsWithError);
    } else {
      this.props.onInvalidSubmit(model, this.resetModel, this.updateInputsWithError);
    }
  };

  // Go through errors from server and grab the components
  // stored in the inputs map. Change their state to invalid
  // and set the serverError message
  updateInputsWithError = errors => {
    Object.keys(errors).forEach((name) => {
      if (!(name in this.state.inputs)) {
        throw new Error(`You are trying to update an input that does not exist. Verify errors object with input names. ${JSON.stringify(errors)}`);
      }

      this.setState(prevState => ({
        isValid: this.props.preventExternalInvalidation,
        externalError: typeof errors[name] === 'string' ? [errors[name]] : errors[name],
      }));
    });
  };

  // Use the binded values and the actual input value to
  // validate the input and set its state. Then check the
  // state of the form itself
  validate = name => {
    // Trigger onChange
    /*if (this.canChange) {
      this.props.onChange(this.getModel(), this.isChanged());
    }

    const validation = this.runValidation(this.state.inputs[name], name);
    // Run through the validations, split them up and call
    // the validator IF there is a value or it is required
    this.setState(prevState => ({
      inputs: {
        ...prevState.inputs,
        [name]: {
          ...prevState.inputs[name],
          isValid: validation.isValid,
          isRequired: validation.isRequired,
          validationError: validation.error,
          externalError: null,          
        },
      },
    }), () => {this.validateForm});*/

    this.validateForm();
  };

  // Validate the form by going through all child input components
  // and check their state
  validateForm = () => {
    // We need a callback as we are validating all inputs again. This will
    // run when the last component has set its state
    const onValidationComplete = () => {
      this.isValid = Obect.keys(this.state.inputs).every(name => this.state.inputs[name].isValid);

      if (this.isValid) {
        this.props.onValid();
      } else {
        this.props.onInvalid();
      }

      // Tell the form that it can start to trigger change events
      this.canChange = true;
    };

    // Run validation again in case affected by other inputs. The
    // last component validated will run the onValidationComplete callback
    this.setState(prevState => ({
      inputs: mapInputState(prevState, (input, name) => {
        if (!input.parsedValidations) {
          return input;
        }

        const validation = this.runValidation(input, name);

        if (validation.isValid && input.externalError) {
          validation.isValid = false;
        }

        return {
          ...input,
          isValid: validation.isValid,
          isRequired: validation.isRequired,
          validationErrorMessages: validation.error,
          externalError: !validation.isValid && input.externalError ?
            input.externalError : null,
        };
      }),
    }));

    // If there are no inputs, set state where form is ready to trigger
    // change event. New inputs might be added later
    if (!this.state.inputs.length) {
      this.canChange = true;
    }
  };

  setValue = (name, value, validate = true) => {
    if (!validate) {
      this.setState({
        inputs: {
          ...this.state.inputs,
          [name]: {
            ...this.state.inputs[name],
            currentValue: value,
          }
        },
      });
    } else {
      this.setState({
        inputs: {
          ...this.state.inputs,
          [name]: {
            ...this.state.inputs[name],
            currentValue: value,
          }
        },
      }, () => {
        this.validate(name);
      });
    }
  };

  resetValue = name => {
    this.setState({
      inputs: {
        ...this.state.inputs,
        [name]: {
          ...this.state.inputs[name],
          currentValue: this.state.inputs[name].pristineValue,
        },
      }
    }, () => {
      this.validate(name);
    });
  };

  setValidations = (name, validations, required) => {
    const otherValidations = convertValidationsToObject(validations) || {};

    const requiredValidations = required === true ? { isDefaultRequiredValue: true } :
      convertValidationsToObject(required);

    if (this._isMounted) {
      this.setState(prevState => ({
        inputs: {
          ...prevState,
          [name]: {
            ...prevState[name],
            parsedValidations: otherValidations,
            parsedRequiredValidations: requiredValidations,
          },
        },
      }));
    }
    else {
      this.preMountInputState[name].parsedValidations = otherValidations;
      this.preMountInputState[name].parsedRequiredValidations = requiredValidations;
    }
  };

  render() {
    const {
      getErrorMessage,
      getErrorMessages,
      getValue,
      hasValue,
      mapping,
      onChange,
      // onError,
      onInvalidSubmit,
      onInvalid,
      onReset,
      onSubmit,
      onValid,
      onValidSubmit,
      preventExternalInvalidation,
      // reset,
      resetValue,
      validationErrors,
      ...nonFormsyProps
    } = this.props;

    return (
      <form
        onReset={this.resetInternal}
        onSubmit={this.submit}
        {...nonFormsyProps}
        disabled={false}
      >
        { React.Children.map(this.props.children, child =>
          child && React.cloneElement(child, { formsy: this.methodsToPassToChildren, ...(this.state.inputs[child.props.name] || {}), isFormDisabled: this.props.disabled })
        ) }
      </form>
    );
  }
}

Formsy.displayName = 'Formsy';

Formsy.defaultProps = {
  children: null,
  disabled: false,
  getErrorMessage: () => {},
  getErrorMessages: () => {},
  getValue: () => {},
  mapping: null,
  onChange: () => {},
  onError: () => {},
  onInvalid: () => {},
  onInvalidSubmit: () => {},
  onReset: () => {},
  onSubmit: () => {},
  onValid: () => {},
  onValidSubmit: () => {},
  preventExternalInvalidation: false,
  resetValue: () => {},
  validationErrors: null,
};

Formsy.propTypes = {
  children: PropTypes.node,
  disabled: PropTypes.bool,
  getErrorMessage: PropTypes.func,
  getErrorMessages: PropTypes.func,
  getValue: PropTypes.func,
  mapping: PropTypes.func,
  onChange: PropTypes.func,
  onInvalid: PropTypes.func,
  onInvalidSubmit: PropTypes.func,
  onReset: PropTypes.func,
  onSubmit: PropTypes.func,
  onValid: PropTypes.func,
  onValidSubmit: PropTypes.func,
  preventExternalInvalidation: PropTypes.bool,
  resetValue: PropTypes.func,
  validationErrors: PropTypes.object, // eslint-disable-line
};

const addValidationRule = (name, func) => {
  validationRules[name] = func;
};

export {
  addValidationRule,
  propTypes,
  validationRules,
  Wrapper as withFormsy,
};

export default Formsy;
