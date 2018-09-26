import React from 'react';
import TestUtils from 'react-dom/test-utils';
import sinon from 'sinon';

import Formsy, { withFormsy } from '../src';
import TestInput, { InputFactory, TestInput as InnerInput } from './utils/TestInput';
import immediate from './utils/immediate';

export default {

  'should pass down correct value prop after using setValue()': function (test) {

    const form = TestUtils.renderIntoDocument(
      <Formsy>
        <TestInput name="foo" value="foo"/>
      </Formsy>
    );

    let input = TestUtils.findRenderedDOMComponentWithTag(form, 'INPUT');
    test.equal(input.value, 'foo');
    TestUtils.Simulate.change(input, {target: {value: 'foobar'}});

    input = TestUtils.findRenderedDOMComponentWithTag(form, 'INPUT');
    test.equal(input.value, 'foobar');
    test.done();
  },

  'withFormsy: should only set the value and not validate when calling setValue(val, false)': function (test) {

    const Input = withFormsy(class TestInput extends React.Component {
        updateValue = (event) => {
            this.props.setValue(event.target.value, false);
        }
        render() {
            return <input type="text" value={this.props.value} onChange={this.updateValue}/>;
        }
    })

    const form = TestUtils.renderIntoDocument(
        <Formsy>
            <Input name="foo" value="foo" innerRef="comp" />
        </Formsy>
    );

    const validateSpy = sinon.spy(form, 'validate');
    const inputElement = TestUtils.findRenderedDOMComponentWithTag(form, 'INPUT');

    validateSpy.reset();
    TestUtils.Simulate.change(inputElement, {target: {value: 'foobar'}});
    test.equal(validateSpy.notCalled, true);
    test.done();

  },

  'should set back to pristine value when running reset': function (test) {

    let reset = null;
    const Input = InputFactory({
      componentDidMount: function() {
          reset = this.props.resetValue;
      }
    });
    const form = TestUtils.renderIntoDocument(
      <Formsy>
        <Input name="foo" value="foo"/>
      </Formsy>
    );

    const input = TestUtils.findRenderedDOMComponentWithTag(form, 'INPUT');
    TestUtils.Simulate.change(input, {target: {value: 'foobar'}});
    reset();
    test.equal(input.value, 'foo');

    test.done();

  },

  'should return error message passed when calling getErrorMessage()': function (test) {

    let errorMessage = null;

    /*const Input = InputFactory({
      componentDidMount: function() {
        errorMessage = this.props.errorMessage;
      }
    });*/

    const form = TestUtils.renderIntoDocument(
      <Formsy>
        <TestInput name="foo" value="foo" validations="isEmail" validationError="Has to be email"/>
      </Formsy>
    );

    const input = TestUtils.findRenderedComponentWithType(form, TestInput);

    errorMessage = input.getErrorMessage();

    test.equal(errorMessage, 'Has to be email');

    test.done();

  },

  'should have isValid true or false depending on valid state': function (test) {

    const form = TestUtils.renderIntoDocument(
      <Formsy action="/users">
        <TestInput name="foo" value="foo" validations="isEmail"/>
      </Formsy>
    );
    
    let inputComponent = TestUtils.findRenderedComponentWithType(form, TestInput);
    test.equal(inputComponent.props.isValid, false);

    let inputNode = TestUtils.findRenderedDOMComponentWithTag(form, 'INPUT');
    TestUtils.Simulate.change(inputNode, {target: {value: 'foo@foo.com'}});

    inputComponent= TestUtils.findRenderedComponentWithType(form, TestInput);
    test.equal(inputComponent.props.isValid, true);

    test.done();

  },

  'should have required true or false depending on passed required attribute': function (test) {

    const form = TestUtils.renderIntoDocument(
      <Formsy action="/users">
        <TestInput name="foo1" value=""/>
        <TestInput name="foo2" value="" required/>
        <TestInput name="foo3" value="foo" required="isLength:3"/>
      </Formsy>
    );

    const inputs = TestUtils.scryRenderedComponentsWithType(form, InnerInput);

    test.equal(inputs[0].props.isRequired, false);
    test.equal(inputs[1].props.isRequired, true);
    test.equal(inputs[2].props.isRequired, true);

    test.done();

  },

  'should have isRequired true or false depending on input being empty and required is passed, or not': function (test) {

    const form = TestUtils.renderIntoDocument(
      <Formsy action="/users">
        <TestInput name="A" value="foo"/>
        <TestInput name="B" value="" required/>
        <TestInput name="C" value=""/>
      </Formsy>
    );

    const inputs = TestUtils.scryRenderedComponentsWithType(form, InnerInput);

    test.equal(inputs[0].props.showRequired, false);
    test.equal(inputs[1].props.showRequired, true);
    test.equal(inputs[2].props.showRequired, false);

    test.done();

  },

  'should have isPristine true or false depending on whether input has been "touched" or not': function (test) {

    const form = TestUtils.renderIntoDocument(
      <Formsy action="/users">
        <TestInput name="A" value="foo"/>
      </Formsy>
    );

    let inputComponent = TestUtils.findRenderedComponentWithType(form, InnerInput);
    test.equal(inputComponent.props.isPristine, true);
    
    const inputNode = TestUtils.findRenderedDOMComponentWithTag(form, 'INPUT');
    TestUtils.Simulate.change(inputNode, {target: {value: 'bar'}});

    inputComponent = TestUtils.findRenderedComponentWithType(form, InnerInput);
    test.equal(inputComponent.props.isPristine, false);

    test.done();

  },

  'should allow an undefined value to be updated to a value': function (test) {

    class TestForm extends React.Component {
      state = {value: undefined};

      changeValue = () => {
        this.setState({
          value: 'foo'
        });
      }

      render() {
        return (
          <Formsy action="/users">
            <TestInput name="A" value={this.state.value} />
          </Formsy>
        );
      }
    }

    const form = TestUtils.renderIntoDocument(<TestForm/>);

    form.changeValue();
    const input = TestUtils.findRenderedDOMComponentWithTag(form, 'INPUT');

    immediate(() => {
      test.equal(input.value, 'foo');
      test.done();
    });

  },

  'should be able to test a values validity': function (test) {

    class TestForm extends React.Component {
      render() {
        return (
          <Formsy>
            <TestInput name="A" validations="isEmail"/>
          </Formsy>
        );
      }
    }
    const form = TestUtils.renderIntoDocument(<TestForm/>);

    const input = TestUtils.findRenderedComponentWithType(form, TestInput);
    test.equal(input.isValidValue('foo@bar.com'), true);
    test.equal(input.isValidValue('foo@bar'), false);
    test.done();

  },

  'should be able to use an object as validations property': function (test) {

    class TestForm extends React.Component {
      render() {
        return (
          <Formsy>
            <TestInput name="A" validations={{
              isEmail: true
            }}/>
          </Formsy>
        );
      }
    }
    const form = TestUtils.renderIntoDocument(<TestForm/>);

    const input = TestUtils.findRenderedComponentWithType(form, TestInput);
    test.equal(input.isValidValue('foo@bar.com'), true);
    test.equal(input.isValidValue('foo@bar'), false);

    test.done();

  },

  'should be able to pass complex values to a validation rule': function (test) {

    class TestForm extends React.Component {
      render() {
        return (
          <Formsy>
            <TestInput name="A" validations={{
              matchRegexp: /foo/
            }} value="foo"/>
          </Formsy>
        );
      }
    }
    const form = TestUtils.renderIntoDocument(<TestForm/>);

    const inputComponent = TestUtils.findRenderedComponentWithType(form, TestInput);
    test.equal(inputComponent.props.isValid, true);

    const input = TestUtils.findRenderedDOMComponentWithTag(form, 'INPUT');
    TestUtils.Simulate.change(input, {target: {value: 'bar'}});

    test.equal(inputComponent.props.isValid, false);

    test.done();

  },

  'should be able to run a function to validate': function (test) {

    class TestForm extends React.Component {
      customValidationA(values, value) {
        return value === 'foo';
      }

      customValidationB(values, value) {
        return value === 'foo' && values.A === 'foo';
      }

      render() {
        return (
          <Formsy>
            <TestInput name="A" validations={{
              custom: this.customValidationA
            }} value="foo"/>
            <TestInput name="B" validations={{
              custom: this.customValidationB
            }} value="foo"/>
          </Formsy>
        );
      }
    }

    const form = TestUtils.renderIntoDocument(<TestForm/>);

    const inputComponent = TestUtils.scryRenderedComponentsWithType(form, TestInput);
    test.equal(inputComponent[0].props.isValid, true);
    test.equal(inputComponent[1].props.isValid, true);

    const input = TestUtils.scryRenderedDOMComponentsWithTag(form, 'INPUT');
    TestUtils.Simulate.change(input[0], {target: {value: 'bar'}});

    test.equal(inputComponent[0].props.isValid, false);
    test.equal(inputComponent[1].props.isValid, false);

    test.done();

  },

  'should not override error messages with error messages passed by form if passed eror messages is an empty object': function (test) {

    class TestForm extends React.Component {
      render() {
        return (
          <Formsy validationErrors={{}}>
            <TestInput name="A" validations={{
              isEmail: true
            }} validationError="bar2" validationErrors={{isEmail: 'bar3'}} value="foo"/>
          </Formsy>
        );
      }
    }
    const form = TestUtils.renderIntoDocument(<TestForm/>);

    const inputComponent = TestUtils.findRenderedComponentWithType(form, TestInput);
    test.equal(inputComponent.getErrorMessage(), 'bar3');

    test.done();

  },

  'should override all error messages with error messages passed by form': function (test) {

    class TestForm extends React.Component {
      render() {
        return (
          <Formsy validationErrors={{A: 'bar'}}>
            <TestInput name="A" validations={{
              isEmail: true
            }} validationError="bar2" validationErrors={{isEmail: 'bar3'}} value="foo"/>
          </Formsy>
        );
      }
    }
    const form = TestUtils.renderIntoDocument(<TestForm/>);

    const inputComponent = TestUtils.findRenderedComponentWithType(form, TestInput);
    test.equal(inputComponent.getErrorMessage(), 'bar');

    test.done();

  },

  'should override validation rules with required rules': function (test) {

    class TestForm extends React.Component {
      render() {
        return (
          <Formsy>
            <TestInput name="A"
              validations={{
                isEmail: true
              }}
              validationError="bar"
              validationErrors={{isEmail: 'bar2', isLength: 'bar3'}}
              value="f"
              required={{
                isLength: 1
              }}
            />
          </Formsy>
        );
      }
    }
    const form = TestUtils.renderIntoDocument(<TestForm/>);

    const inputComponent = TestUtils.findRenderedComponentWithType(form, TestInput);
    test.equal(inputComponent.getErrorMessage(), 'bar3');

    test.done();

  },

  'should fall back to default error message when non exist in validationErrors map': function (test) {

    class TestForm extends React.Component {
      render() {
        return (
          <Formsy>
            <TestInput name="A"
              validations={{
                isEmail: true
              }}
              validationError="bar1"
              validationErrors={{foo: 'bar2'}}
              value="foo"
            />
          </Formsy>
        );
      }
    }
    const form = TestUtils.renderIntoDocument(<TestForm/>);

    const inputComponent = TestUtils.findRenderedComponentWithType(form, TestInput);
    test.equal(inputComponent.getErrorMessage(), 'bar1');

    test.done();

  },

  'should not be valid if it is required and required rule is true': function (test) {

    class TestForm extends React.Component {
      render() {
        return (
          <Formsy>
            <TestInput name="A"
            required
            />
          </Formsy>
        );
      }
    }
    const form = TestUtils.renderIntoDocument(<TestForm/>);

    const inputComponent = TestUtils.findRenderedComponentWithType(form, TestInput);
    test.equal(inputComponent.props.isValid, false);

    test.done();

  },

  'should handle objects and arrays as values': function (test) {

    class TestForm extends React.Component {
      state = {
        foo: {foo: 'bar'},
        bar: ['foo']
      }
      render() {
        return (
          <Formsy>
            <TestInput name="foo" value={this.state.foo}/>
            <TestInput name="bar" value={this.state.bar}/>
          </Formsy>
        );
      }
    }
    const form = TestUtils.renderIntoDocument(<TestForm/>);

    form.setState({
      foo: {foo: 'foo'},
      bar: ['bar']
    });

    const inputs = TestUtils.scryRenderedComponentsWithType(form, TestInput);
    test.deepEqual(inputs[0].getValue(), {foo: 'foo'});
    test.deepEqual(inputs[1].getValue(), ['bar']);

    test.done();

  },

  'should handle isFormDisabled with dynamic inputs': function (test) {

    class TestForm extends React.Component {
      state = { bool: true }
      flip = () => {
        this.setState({
          bool: !this.state.bool
        });
      }
      render() {
        return (
          <Formsy disabled={this.state.bool}>
            {this.state.bool ?
              <TestInput name="foo" /> :
              <TestInput name="bar" />
            }
          </Formsy>
        );
      }
    }
    const form = TestUtils.renderIntoDocument(<TestForm/>);

    const input = TestUtils.findRenderedComponentWithType(form, TestInput);
    test.equal(input.isFormDisabled(), true);
    form.flip();
    test.equal(input.isFormDisabled(), false);

    test.done();

  },

  'should allow for dot notation in name which maps to a deep object': function (test) {

    class TestForm extends React.Component {
      onSubmit(model) {
        test.deepEqual(model, {foo: {bar: 'foo', test: 'test'}});
      }
      render() {
        return (
          <Formsy onSubmit={this.onSubmit}>
            <TestInput name="foo.bar" value="foo"/>
            <TestInput name="foo.test" value="test"/>
          </Formsy>
        );
      }
    }
    const form = TestUtils.renderIntoDocument(<TestForm/>);

    test.expect(1);

    const formEl = TestUtils.findRenderedDOMComponentWithTag(form, 'form');
    TestUtils.Simulate.submit(formEl);

    test.done();

  },

  'should allow for application/x-www-form-urlencoded syntax and convert to object': function (test) {

    class TestForm extends React.Component {
      onSubmit(model) {
        test.deepEqual(model, {foo: ['foo', 'bar']});
      }
      render() {
        return (
          <Formsy onSubmit={this.onSubmit}>
            <TestInput name="foo[0]" value="foo"/>
            <TestInput name="foo[1]" value="bar"/>
          </Formsy>
        );
      }
    }
    const form = TestUtils.renderIntoDocument(<TestForm/>);

    test.expect(1);

    const formEl = TestUtils.findRenderedDOMComponentWithTag(form, 'form');
    TestUtils.Simulate.submit(formEl);

    test.done();

  },

  'input should rendered once with PureRenderMixin': function (test) {

    var renderSpy = sinon.spy();

    const Input = InputFactory({
      shouldComponentUpdate: function() { return false },
      render: function() {
        renderSpy();
        return <input type={this.props.type} value={this.props.value} onChange={this.updateValue}/>;
      }
    });

    const form = TestUtils.renderIntoDocument(
      <Formsy>
        <Input name="foo" value="foo"/>
      </Formsy>
    );

    test.equal(renderSpy.calledOnce, true);

    test.done();

  },

  'binds all necessary methods': function (test) {
    const onInputRef = input => {
      [
        'isValidValue',
        'resetValue',
        'setValidations',
        'setValue',
      ].forEach(fnName => {
        const fn = input[fnName];
        try {
          fn();
        } catch(e) {
          throw new Error(`Method '${fnName}' isn't bound.`);
        }
      });

      test.done();
    }

    TestUtils.renderIntoDocument(
      <Formsy>
        <TestInput ref={onInputRef} name="name" value="foo" />
      </Formsy>
    );
  }

};
