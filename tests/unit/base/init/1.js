const {base} = require('../../../../index');

module.exports = async() => {
    const A = new base();
    
    A.method.add({
        method: 'a.b.in',
        fn: ({payload}) => payload + 1
    });
    A.method.add({
        method: 'a.b.out',
        fn: ({payload}) => payload + 43
    });

    const B = new base();
    B.method.add({
        method: 'b.in',
        fn: ({payload}) => payload + 1
    });
    B.method.add({
        method: 'b.out',
        fn: ({payload}) => payload + 43
    });

    return () => ({A, B});
};