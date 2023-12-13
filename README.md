# Bridg-wrong

[![Build Status](https://travis-ci.com/zetxx/bridg-wrong.svg?branch=master)](https://travis-ci.com/zetxx/bridg-wrong)

## Filesystem structure

- methods(`lib/methods`): holds registered methods
- wire(`lib/wires`): holds methods

### Wire

#### Examle

```javascript
const {Wires, Methods} = require('brid-wrong');
const wires = Wires({.....});
const module1 = Methods({wires});
module1.add({name: 'a.b.c', async(message, {ask, notify}) => {
    // request, it will return response
    const result = await ask({method: 'b.a.d', params: {......}});
    // notification, it will not return any response
    notify({method: 'b.a', params: {....}});
    return ;
}});
const module2 = Methods({wires});
module2.ask({method: 'a.b.c', params: {a: 1}});
```
