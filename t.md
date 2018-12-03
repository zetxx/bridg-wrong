## Calls and Overwrites
### calls
- call `apiRequestReceived` when some internal request is received
- will be called: `apiResponseReceived` when someone responded to api request
### overwrites
- `externalIn` - should be called right after external packages went in
- `externalOut` - should be re-implemented, and called right before external package goes out

### Api
- `registerApiMethod` registers api method (searchApiMethod will search for 3 methods: method, method.in/out, in/out)
- `registerExternalMethod` registers external method