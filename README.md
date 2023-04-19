# Bridg-wrong

Small microservice rpc "as a crossroad" architecture, imagine
a packet is coming from internal side (over api), and should
be send to outside world, after that response is received and
sends back to internal packeter.

[![Build Status](https://travis-ci.com/zetxx/bridg-wrong.svg?branch=master)](https://travis-ci.com/zetxx/bridg-wrong)

## Filesystem structure

- methods(`lib/methods`): holds registered methods
- packets(`lib/packet`): holds all packet that are send somewhere.
- wire: this is half of the crossroad
- router: routes between two wires, this implements 2 wires intersection

### Wire

#### Examle

```javascript
const Wire = require('=./lib/wire');
const wire = Wire({
    // passing log
    log = (level, msg) => console[level](msg),
    // config
    config: {
        // packets config
        packet: {
            // how much time packet to wait before times out
            waitTime = 1000000
        } = {},
        // unique id of the wire
        id
    } = {}
});

wire.methods.add({
    // register method a for incoming packet
    // it is called right after packet is received
    method: 'a',
    // method that will be executed
    // when wire.pass({payload: ..., meta: {method: 'a.in'}}) is called
    fn: ({payload, error}) => {
        // do something useful
        return ...;
    }
});

// special method that will be called
// at the end, when everything else is called/done
wire.methods.add({
    // register method a for incoming packet
    method: '*',
    // method that will be executed
    // when wire.pass({payload: ..., meta: {method: 'a.in'}}) is called
    fn: ({payload, error}) => {
        // do something useful
        return ...;
    }
});

......

// actual method execution
const someResult = await wire.pass({
    payload: ...,
    meta: {method: 'a'}
});

```
