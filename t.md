1. from int world
    1.1. check is there method defined
        1.1.1. yes: executes it
            1.1.1.1. goest to outside world
            1.1.1.2. wait for response if is not notification
            1.1.1.3. response received
            1.1.1.4. check if there is some transformation method before return response to int world
            1.1.1.5. return transformed or not response

        1.1.2. no: throw method not found
            1.1.2.1. return response method not found if needed (if it is not notification)


2. from external world
    2.1. check is there method defined
        2.1.1. yes: executes it
            2.1.1.1. return response if needed (if it is not notification)
        2.1.2. no: throw method not found
            2.1.2.1. return response method not found if needed (if it is not notification)


## edge cases
    1.1. and 2.1. which method to call, where is this method, is it in separate namespace or all methods live
    in one namespace? for instance if node have api (int world) of two methods: fetch and get, should we
    should be able to call it from ext world too?
