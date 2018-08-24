'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withFormsy = exports.validationRules = exports.propTypes = exports.addValidationRule = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _formDataToObject = require('form-data-to-object');

var _formDataToObject2 = _interopRequireDefault(_formDataToObject);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

var _utils = require('./utils');

var _utils2 = _interopRequireDefault(_utils);

var _validationRules = require('./validationRules');

var _validationRules2 = _interopRequireDefault(_validationRules);

var _Wrapper = require('./Wrapper');

var _Wrapper2 = _interopRequireDefault(_Wrapper);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/* eslint-disable react/default-props-match-prop-types */

var initialState = {};

function mapInputState(state, callback) {
  var newState = {};

  Object.keys(this.state.inputs).forEach(function (input, name) {
    newState[name] = callback(input, name);
  });

  return newState;
}

var Formsy = function (_React$Component) {
  _inherits(Formsy, _React$Component);

  function Formsy(props) {
    _classCallCheck(this, Formsy);

    //no need to be in state, they don't affect rendering
    var _this = _possibleConstructorReturn(this, (Formsy.__proto__ || Object.getPrototypeOf(Formsy)).call(this, props));

    _this.mapInputState = function (callback) {
      return mapInputState(_this.state, callback);
    };

    _this.getCurrentValues = function () {
      return Object.keys(_this.state.inputs).map(function (input) {
        return input.value;
      });
    };

    _this.getModel = function () {
      return _this.mapModel(_this.getCurrentValues());
    };

    _this.getPristineValues = function () {
      return Object.keys(_this.state.inputs).map(function (input) {
        return input.pristineValue;
      });
    };

    _this.setFormPristine = function (isPristine) {
      _this.setState(function (prevState) {
        return {
          formSubmitted: !isPristine,
          inputs: mapInputState(prevState, function (input) {
            return _extends({}, input, {
              isPristine: isPristine,
              formSubmitted: !isPristine
            });
          })
        };
      });
    };

    _this.setInputValidationErrors = function (errors) {
      _this.setState(function (prevState) {
        return {
          inputs: mapInputState(prevState, function (input, name) {
            return _extends({}, input, {
              isValid: !(name in errors),
              validationError: typeof errors[name] === 'string' ? [errors[name]] : errors[name]
            });
          })
        };
      });
    };

    _this.mapModel = function (model) {
      if (_this.props.mapping) {
        return _this.props.mapping(model);
      }

      return _formDataToObject2.default.toObj(Object.keys(model).reduce(function (mappedModel, key) {
        var keyArray = key.split('.');
        var base = mappedModel;
        while (keyArray.length) {
          var currentKey = keyArray.shift();
          base[currentKey] = keyArray.length ? base[currentKey] || {} : model[key];
          base = base[currentKey];
        }
        return mappedModel;
      }, {}));
    };

    _this.reset = function (data) {
      _this.setState({
        inputs: initialState.inputs
      });

      _this.setFormPristine(true);

      _this.resetModel(data);
    };

    _this.resetInternal = function (event) {
      event.preventDefault();

      _this.reset();

      if (_this.props.onReset) {
        _this.props.onReset();
      }
    };

    _this.resetModel = function (data) {
      _this.setState(function (prevState) {
        return {
          inputs: mapInputState(prevState, function (input, name) {
            return _extends({}, input, {
              value: name in data ? data[name] : input.pristineValue
            });
          })
        };
      });

      _this.validateForm();
    };

    _this.runValidation = function (name) {
      var value = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : input.value;
      return function () {
        var input = _this.state.inputs[name];

        var currentValues = _this.getCurrentValues();

        var validationError = input.validationError,
            validationErrors = input.validationErrors;


        var validationResults = _utils2.default.runRules(value, currentValues, input.validations, _validationRules2.default);

        var requiredResults = _utils2.default.runRules(value, currentValues, input.requiredValidations, _validationRules2.default);

        var isRequired = Object.keys(input.requiredValidations).length ? !!requiredResults.success.length : false;

        var isValid = !validationResults.failed.length && !(_this.props.validationErrors && _this.props.validationErrors[name]);

        return {
          isRequired: isRequired,
          isValid: isRequired ? false : isValid,
          error: function () {
            if (isValid && !isRequired) {
              return [];
            }

            if (validationResults.errors.length) {
              return validationResults.errors;
            }

            if (_this.props.validationErrors && _this.props.validationErrors[name]) {
              return typeof _this.props.validationErrors[name] === 'string' ? [_this.props.validationErrors[name]] : _this.props.validationErrors[name];
            }

            if (isRequired) {
              var error = validationErrors[requiredResults.success[0]];
              return error ? [error] : null;
            }

            if (validationResults.failed.length) {
              return validationResults.failed.map(function (failed) {
                return validationErrors[failed] ? validationErrors[failed] : validationError;
              }).filter(function (x, pos, arr) {
                return arr.indexOf(x) === pos;
              }); // remove duplicates
            }

            return undefined;
          }()
        };
      }();
    };

    _this.attachToForm = function (name) {
      _this.validate(_this.state.inputs[name]);
    };

    _this.addStateToForm = function (name, state) {
      // if it's mounted we are free to set state
      if (_this._isMounted) {
        _this.setState({
          inputs: _extends({}, _this.state.inputs, _defineProperty({}, name, state))
        });
        // if not mounted then it's the first render
        // we batch state updates to minimize rerenders
      } else {
        _this.preMountInputState[name] = state;
      }
    };

    _this.removeStateFromForm = function (name) {
      var newState = _extends({}, _this.inputs.state);

      delete newState[name];

      _reactDom2.default.unstable_batchedUpdates(function () {
        _this.setState({
          inputs: newState
        });

        _this.validateForm();
      });
    };

    _this.isChanged = function () {
      return !_utils2.default.isSame(_this.getPristineValues(), _this.getCurrentValues());
    };

    _this.submit = function (event) {
      if (event && event.preventDefault) {
        event.preventDefault();
      }

      // Trigger form as not pristine.
      // If any inputs have not been touched yet this will make them dirty
      // so validation becomes visible (if based on isPristine)
      _this.setFormPristine(false);
      var model = _this.getModel();
      _this.props.onSubmit(model, _this.resetModel, _this.updateInputsWithError);
      if (_this.isValid) {
        _this.props.onValidSubmit(model, _this.resetModel, _this.updateInputsWithError);
      } else {
        _this.props.onInvalidSubmit(model, _this.resetModel, _this.updateInputsWithError);
      }
    };

    _this.updateInputsWithError = function (errors) {
      Object.keys(errors).forEach(function (name) {
        if (!(name in _this.state.inputs)) {
          throw new Error('You are trying to update an input that does not exist. Verify errors object with input names. ' + JSON.stringify(errors));
        }

        _this.setState(function (prevState) {
          return {
            isValid: _this.props.preventExternalInvalidation,
            externalError: typeof errors[name] === 'string' ? [errors[name]] : errors[name]
          };
        });
      });
    };

    _this.validate = function (name) {
      // Trigger onChange
      if (_this.canChange) {
        _this.props.onChange(_this.getModel(), _this.isChanged());
      }

      var validation = _this.runValidation(name);
      // Run through the validations, split them up and call
      // the validator IF there is a value or it is required
      _this.setState(function (prevState) {
        return {
          inputs: _extends({}, prevState.inputs, _defineProperty({}, name, {
            isValid: validation.isValid,
            isRequired: validation.isRequired,
            validationError: validation.error,
            externalError: null
          }))
        };
      }, _this.validateForm);
    };

    _this.validateForm = function () {
      // We need a callback as we are validating all inputs again. This will
      // run when the last component has set its state
      var onValidationComplete = function onValidationComplete() {
        _this.isValid = Obect.keys(_this.state.inputs).every(function (name) {
          return _this.state.inputs[name].isValid;
        });

        if (_this.isValid) {
          _this.props.onValid();
        } else {
          _this.props.onInvalid();
        }

        // Tell the form that it can start to trigger change events
        _this.canChange = true;
      };

      // Run validation again in case affected by other inputs. The
      // last component validated will run the onValidationComplete callback
      _this.setState(function (prevState) {
        return {
          inputs: mapInputState(prevState, function (input, name) {
            var validation = _this.runValidation(name);

            if (validation.isValid && input.externalError) {
              validation.isValid = false;
            }

            return _extends({}, input, {
              isValid: validation.isValid,
              isRequired: validation.isRequired,
              validationError: validation.error,
              externalError: !validation.isValid && input.externalError ? input.externalError : null
            });
          })
        };
      });

      // If there are no inputs, set state where form is ready to trigger
      // change event. New inputs might be added later
      if (!_this.state.inputs.length) {
        _this.canChange = true;
      }
    };

    _this.setValue = function (name, value) {
      var validate = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

      if (!validate) {
        _this.setState({
          inputs: _extends({}, _this.state.inputs, _defineProperty({}, name, _extends({}, _this.state.inputs[name], {
            value: value
          })))
        });
      } else {
        _this.setState({
          inputs: _extends({}, _this.state.inputs, _defineProperty({}, name, _extends({}, _this.state.inputs[name], {
            value: value,
            isPristine: false
          })))
        }, function () {
          _this.validate(name);
        });
      }
    };

    _this.resetValue = function (name) {
      _this.setState({
        inputs: _extends({}, _this.state.inputs, _defineProperty({}, name, {
          value: _this.state.inputs[name].pristineValue,
          isPristine: true
        }))
      }, function () {
        _this.validate(name);
      });
    };

    _this.isValid = true;
    _this.canChange = false;
    _this._isMounted = false;

    //references to children, should aim to remove this
    _this.inputs = [];

    //using this to batch input state updates
    //instead of setting state evrey time an input mounts
    //we add its state here
    //then do one setState for the form in its CDM
    _this.preMountInputState = {};

    _this.state = initialState;

    _this.methodsToPassToChildren = {
      attachToForm: _this.attachToForm,
      addStateToForm: _this.addStateToForm,
      removeStateFromForm: _this.removeStateFromForm,
      validate: _this.validate,
      isValidValue: function isValidValue(name, value) {
        return _this.runValidation(name, value).isValid;
      },
      setValue: _this.setValue,
      resetValue: _this.resetValue
    };
    return _this;
  }

  _createClass(Formsy, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      var _this2 = this;

      this._isMounted = true;

      _reactDom2.default.unstable_batchedUpdates(function () {
        _this2.setState({
          inputs: _this2.preMountInputState
        });

        _this2.validateForm();
      });
    }
  }, {
    key: 'componentDidUpdate',
    value: function componentDidUpdate(prevProps, prevState) {
      var _this3 = this;

      _reactDom2.default.unstable_batchedUpdates(function () {
        if (_this3.props.validationErrors && _typeof(_this3.props.validationErrors) === 'object' && Object.keys(_this3.props.validationErrors).length > 0) {
          _this3.setInputValidationErrors(_this3.props.validationErrors);
        }

        if (_this3.state.inputs != prevState.inputs) {
          _this3.validateForm();
        }
      });
    }

    // Reset each key in the model to the original / initial / specified value


    // Checks validation on current value or a passed value


    // Method put on each input component to register
    // itself to the form


    // Checks if the values have changed from their initial value


    // Update model, submit to url prop and send the model


    // Go through errors from server and grab the components
    // stored in the inputs map. Change their state to invalid
    // and set the serverError message


    // Use the binded values and the actual input value to
    // validate the input and set its state. Then check the
    // state of the form itself


    // Validate the form by going through all child input components
    // and check their state

  }, {
    key: 'render',
    value: function render() {
      var _this4 = this;

      var _props = this.props,
          getErrorMessage = _props.getErrorMessage,
          getErrorMessages = _props.getErrorMessages,
          getValue = _props.getValue,
          hasValue = _props.hasValue,
          mapping = _props.mapping,
          onChange = _props.onChange,
          onInvalidSubmit = _props.onInvalidSubmit,
          onInvalid = _props.onInvalid,
          onReset = _props.onReset,
          onSubmit = _props.onSubmit,
          onValid = _props.onValid,
          onValidSubmit = _props.onValidSubmit,
          preventExternalInvalidation = _props.preventExternalInvalidation,
          resetValue = _props.resetValue,
          setValidations = _props.setValidations,
          showError = _props.showError,
          showRequired = _props.showRequired,
          validationErrors = _props.validationErrors,
          nonFormsyProps = _objectWithoutProperties(_props, ['getErrorMessage', 'getErrorMessages', 'getValue', 'hasValue', 'mapping', 'onChange', 'onInvalidSubmit', 'onInvalid', 'onReset', 'onSubmit', 'onValid', 'onValidSubmit', 'preventExternalInvalidation', 'resetValue', 'setValidations', 'showError', 'showRequired', 'validationErrors']);

      return _react2.default.createElement(
        'form',
        _extends({
          onReset: this.resetInternal,
          onSubmit: this.submit
        }, nonFormsyProps, {
          disabled: false
        }),
        _react2.default.Children.map(this.props.children, function (child) {
          return child && _react2.default.cloneElement(child, _extends({ formsy: _this4.methodsToPassToChildren }, _this4.state.inputs[child.props.name], { isFormDisabled: _this4.props.disabled }));
        })
      );
    }
  }], [{
    key: 'getDerivedStateFromProps',
    value: function getDerivedStateFromProps(props, state) {
      //set validation errors in state if provided through props
      if (props.validationErrors && _typeof(props.validationErrors) === 'object' && Object.keys(props.validationErrors).length > 0) {
        return {
          inputs: mapInputState(state.inputs, function (input, name) {
            return _extends({}, input, {
              isValid: !(name in errors),
              validationError: typeof errors[name] === 'string' ? [errors[name]] : errors[name]
            });
          })
        };
      }

      return null;
    }
  }]);

  return Formsy;
}(_react2.default.Component);

Formsy.displayName = 'Formsy';

Formsy.defaultProps = {
  children: null,
  disabled: false,
  getErrorMessage: function getErrorMessage() {},
  getErrorMessages: function getErrorMessages() {},
  getValue: function getValue() {},
  mapping: null,
  onChange: function onChange() {},
  onError: function onError() {},
  onInvalid: function onInvalid() {},
  onInvalidSubmit: function onInvalidSubmit() {},
  onReset: function onReset() {},
  onSubmit: function onSubmit() {},
  onValid: function onValid() {},
  onValidSubmit: function onValidSubmit() {},
  preventExternalInvalidation: false,
  resetValue: function resetValue() {},
  setValidations: function setValidations() {},
  showError: function showError() {},
  showRequired: function showRequired() {},
  validationErrors: null
};

Formsy.propTypes = {
  children: _propTypes2.default.node,
  disabled: _propTypes2.default.bool,
  getErrorMessage: _propTypes2.default.func,
  getErrorMessages: _propTypes2.default.func,
  getValue: _propTypes2.default.func,
  mapping: _propTypes2.default.func,
  onChange: _propTypes2.default.func,
  onInvalid: _propTypes2.default.func,
  onInvalidSubmit: _propTypes2.default.func,
  onReset: _propTypes2.default.func,
  onSubmit: _propTypes2.default.func,
  onValid: _propTypes2.default.func,
  onValidSubmit: _propTypes2.default.func,
  preventExternalInvalidation: _propTypes2.default.bool,
  resetValue: _propTypes2.default.func,
  setValidations: _propTypes2.default.func,
  showError: _propTypes2.default.func,
  showRequired: _propTypes2.default.func,
  validationErrors: _propTypes2.default.object // eslint-disable-line
};

var addValidationRule = function addValidationRule(name, func) {
  _validationRules2.default[name] = func;
};

exports.addValidationRule = addValidationRule;
exports.propTypes = _Wrapper.propTypes;
exports.validationRules = _validationRules2.default;
exports.withFormsy = _Wrapper2.default;
exports.default = Formsy;