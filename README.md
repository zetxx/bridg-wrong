Small microservice rpc "as a crossroad" architecture, imagine
a request is comming from internal side (over api), and should
be send to outside world, after that response is received and
sends back to internal requester.

[![Build Status](https://travis-ci.com/zetxx/bridg-wrong.svg?branch=master)](https://travis-ci.com/zetxx/bridg-wrong)

## Filesystem structure

- methods(`lib/methods`): holds registered methods
- requests(`lib/requests`): holds all request that are send somewhere.
- vector: this is half of the crossroad
- router: routes between two vectors, this implements 2 vectors intersection

### Vector

#### Examle

```javascript
const Vector = require('=./lib/vector');
const vector = Vector({
    // passing log
    log = (level, msg) => console[level](msg),
    // config
    config: {
        // requests config
        request: {
            // how much time request to wait before times out
            waitTime = 1000000
        } = {},
        // unique id of the vector
        id
    } = {}
});

vector.methods.add({
    // register method a for incoming request
    // it is called right after request is received
    method: 'a',
    // method that will be executed
    // when vector.pass({payload: ..., meta: {method: 'a.in'}}) is called
    fn: ({payload, error}) => {
        // do something useful
        return ...;
    }
});

// special method that will be called
// at the end, when everything else is called/done
vector.methods.add({
    // register method a for incoming request
    method: '*',
    // method that will be executed
    // when vector.pass({payload: ..., meta: {method: 'a.in'}}) is called
    fn: ({payload, error}) => {
        // do something useful
        return ...;
    }
});

......

// actual method execution
const someResult = await vector.pass({
    payload: ...,
    meta: {method: 'a'}
});

```
