## Build
[![Build Status](https://travis-ci.com/zetxx/bridg-wrong.svg?branch=master)](https://travis-ci.com/zetxx/bridg-wrong)


## Calls and Overwrites
- Internal requests
    - call `apiRequestReceived` when some request is received
    - will be called: `apiResponseReceived` when someone responded to api request

### API
- `meta` can have following props `{method, isNotification, timeout, apiRequestId, resolve, reject, deadIn}`
    * `method` - used to for tell what method to be executed
    * `isNotification` - if truty api request will be marked as notification, response will be returned imidietely
    * `timeout` - after how many ms. request will expire
    * `apiRequestId` - used for response matching against api request
    * `resolve` & `reject` - internal usage ony, it resolves api request
    * `deadIn` - internal usage only, used to trase if message is timeouted, or there is no such `apiRequestId` available for matching
#### `apiRequestReceived({message, meta})`
#### `apiResponseReceived({result, error, meta})`
#### `registerApiMethod({method, fn, meta})`
example:
```js
var service = new Service({name: '...'});
service.registerExternalMethod({
    method: 'networkCommand',
    fn: function(message) {
        return message;
    }
});
service.start()
    .then((e) => service.log('info', {description: 'service ready', args: {fingerprint: service.getFingerprint()}}))
    .catch((e) => service.log('error', e));
```
#### `registerExternalMethod({method, fn, meta})`

### Overwrites
#### `externalIn({result, error, meta})` - should be called right after external packages went in
#### `externalOut({result, error, meta})` - should be re-implemented, and called right before external package goes out

