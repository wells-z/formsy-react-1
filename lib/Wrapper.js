'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.propTypes = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _utils = require('./utils');

var _utils2 = _interopRequireDefault(_utils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/* eslint-disable react/default-props-match-prop-types */

var convertValidationsToObject = function convertValidationsToObject(validations) {
  if (typeof validations === 'string') {
    return validations.split(/,(?![^{[]*[}\]])/g).reduce(function (validationsAccumulator, validation) {
      var args = validation.split(':');
      var validateMethod = args.shift();

      args = args.map(function (arg) {
        try {
          return JSON.parse(arg);
        } catch (e) {
          return arg; // It is a string if it can not parse it
        }
      });

      if (args.length > 1) {
        throw new Error('Formsy does not support multiple args on string validations. Use object format of validations instead.');
      }

      // Avoid parameter reassignment
      var validationsAccumulatorCopy = Object.assign({}, validationsAccumulator);
      validationsAccumulatorCopy[validateMethod] = args.length ? args[0] : true;
      return validationsAccumulatorCopy;
    }, {});
  }

  return validations || {};
};

var propTypes = {
  name: _propTypes2.default.string.isRequired,
  required: _propTypes2.default.oneOfType([_propTypes2.default.bool, _propTypes2.default.object, _propTypes2.default.string]),
  validations: _propTypes2.default.oneOfType([_propTypes2.default.object, _propTypes2.default.string]),
  value: _propTypes2.default.any, // eslint-disable-line react/forbid-prop-types
  formsy: _propTypes2.default.object.isRequired // eslint-disable-line react/forbid-prop-types
};

exports.propTypes = propTypes;

exports.default = function (Component) {
  var WrappedComponent = function (_React$Component) {
    _inherits(WrappedComponent, _React$Component);

    function WrappedComponent() {
      var _ref;

      var _temp, _this, _ret;

      _classCallCheck(this, WrappedComponent);

      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return _ret = (_temp = (_this = _possibleConstructorReturn(this, (_ref = WrappedComponent.__proto__ || Object.getPrototypeOf(WrappedComponent)).call.apply(_ref, [this].concat(args))), _this), _this.getErrorMessage = function () {
        var messages = _this.getErrorMessages();

        return messages.length ? messages[0] : null;
      }, _this.getErrorMessages = function () {
        if (!_this.props.isValid || _this.props.isRequired) {
          return _this.props.externalError || _this.props.validationError || [];
        }

        return [];
      }, _this.setValidations = function (validations, required) {
        // Add validations to the store itself as the props object can not be modified
        _this.validations = convertValidationsToObject(validations) || {};
        _this.requiredValidations = required === true ? { isDefaultRequiredValue: true } : convertValidationsToObject(required);
      }, _this.setValue = function (value) {
        var validate = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

        _this.formsy.setValue(_this.props.name, value, validate);
      }, _this.isValidValue = function (value) {
        return _this.props.formsy.isValidValue(_this.props.name, value);
      }, _this.resetValue = function () {
        _this.props.formsy.resetValue(_this.props.name);
      }, _this.showError = function () {
        return !_this.props.isRequired() && !_this.props.isValid;
      }, _temp), _possibleConstructorReturn(_this, _ret);
    }

    _createClass(WrappedComponent, [{
      key: 'componentWillMount',
      value: function componentWillMount() {
        if (!this.props.name) {
          throw new Error('Form field requires a name property when used');
        }

        this.setValidations(this.props.validations, this.props.required);

        this.props.formsy.attachToForm(this.props.name);
      }
    }, {
      key: 'componentDidMount',
      value: function componentDidMount() {
        this.setValidations(this.props.validations, this.props.required);

        this.props.formsy.addStateToForm(this.props.name, {
          value: this.props.value,
          isRequired: this.props.isRequired,
          isValid: true,
          isPristine: true,
          pristineValue: this.props.value,
          validationError: [],
          externalError: null,
          formSubmitted: false
        });
      }

      // We have to make sure the validate method is kept when new props are added

    }, {
      key: 'componentWillUpdate',
      value: function componentWillUpdate(nextProps) {
        if (!_utils2.default.isSame(nextProps.validations, this.props.validations) || !_utils2.default.isSame(nextProps.required, this.props.required)) {
          this.setValidations(nextProps.validations, nextProps.required);
        }
      }
    }, {
      key: 'componentDidUpdate',
      value: function componentDidUpdate(prevProps) {
        // If validations or required is changed, run a new validation
        if (!_utils2.default.isSame(this.props.validations, prevProps.validations) || !_utils2.default.isSame(this.props.required, prevProps.required)) {
          this.props.formsy.validate(this.props.name);
        }
      }

      // Detach it when component unmounts

    }, {
      key: 'componentWillUnmount',
      value: function componentWillUnmount() {
        this.props.formsy.removeStateFromForm(this.props.name);
      }

      // By default, we validate after the value has been set.
      // A user can override this and pass a second parameter of `false` to skip validation.

    }, {
      key: 'render',
      value: function render() {
        var propsForElement = _extends({}, this.props, {
          errorMessage: this.getErrorMessage(),
          errorMessages: this.getErrorMessages(),
          hasValue: !!this.props.value,
          isFormDisabled: this.props.isFormDisabled,
          isFormSubmitted: this.props.formSubmitted,
          isPristine: this.props.isPristine,
          isRequired: this.props.required,
          isValid: this.props.isValid,
          isValidValue: this.isValidValue,
          resetValue: this.resetValue,
          setValidations: this.setValidations,
          setValue: this.setValue,
          showError: this.showError(),
          showRequired: this.props.isRequired,
          value: this.props.value
        });

        return _react2.default.createElement(Component, propsForElement);
      }
    }]);

    return WrappedComponent;
  }(_react2.default.Component);

  function getDisplayName(component) {
    return component.displayName || component.name || (typeof component === 'string' ? component : 'Component');
  }

  WrappedComponent.displayName = 'Formsy(' + getDisplayName(Component) + ')';

  WrappedComponent.defaultProps = {
    required: false,
    validationError: '',
    validationErrors: {},
    validations: null,
    value: Component.defaultValue
  };

  WrappedComponent.propTypes = propTypes;

  return WrappedComponent;
};