const flatten = require('flat');

const CreateError = ({code, parent, message}) => {
    class CustomError extends (parent || Error) {
        constructor(innerMessage = message, props = {state: null}) {
            super(innerMessage);
            let {state, id} = props;
            this.data = {
                state: null,
                id: null
            };
            // Maintains proper stack trace for where our error was thrown (only available on V8)
            Error.captureStackTrace && Error.captureStackTrace(this, CustomError);

            this.code = (this.code && [this.code, code].join('.')) || code;
            this.state = state;
            id && (this.id = id);
        }
        set state(state) {
            state && (this.data.state = {...(this.data.state || {}), ...flatten(state)});
        }
        get state() {
            return this.data.state;
        }
        set id(id) {
            id && (this.data.id = id);
        }
        get id() {
            return this.data.id;
        }
    }
    return CustomError;
};

module.exports = CreateError;
