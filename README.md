# Event

```bash
npm install parthpatel1001/event
```
## Subscribing to events

#### With a callback
```JS
var Event = require('Event');

Event.subscribe('record.created',function(data){
    console.log(Date.now(),'Got an event',data);
});

for(var i = 0; i < 5; i++) {
    Event.publish('record.created',{hello:'world'});
}
```

#### With a object
```JS
var Event = require('Event');
var RecordCreated = function() {
    this.subscribe = function(data){
        console.log(Date.now(),'RecordCreated',data);
    };
}

Event.subscribe('record.created',new RecordCreated());
```

## Subscribing to events with a lock
```JS
for(var i = 0; i < 5; i++) {
	Event.subscribeLock('record.created',function(data){
		console.log('subscriber',data._subscriber_id,'cb called for event',data._event_id);
	});
}
Event.publish(['record.created'],{id:55,color:'red'});

/*
1434150903816 'set a lock on' 'db422e93-1158-11e5-a605-fd1c6b6c5bbc' 'for' 'db420780-1158-11e5-a605-fd1c6b6c5bbc'
subscriber db420780-1158-11e5-a605-fd1c6b6c5bbc cb called for event db422e93-1158-11e5-a605-fd1c6b6c5bbc
1434150903822 'event' 'db422e93-1158-11e5-a605-fd1c6b6c5bbc' 'was locked for' 'db420781-1158-11e5-a605-fd1c6b6c5bbc'
1434150903822 'event' 'db422e93-1158-11e5-a605-fd1c6b6c5bbc' 'was locked for' 'db422e90-1158-11e5-a605-fd1c6b6c5bbc'
1434150903822 'event' 'db422e93-1158-11e5-a605-fd1c6b6c5bbc' 'was locked for' 'db422e91-1158-11e5-a605-fd1c6b6c5bbc'
1434150903822 'event' 'db422e93-1158-11e5-a605-fd1c6b6c5bbc' 'was locked for' 'db422e92-1158-11e5-a605-fd1c6b6c5bbc'
*/
```
