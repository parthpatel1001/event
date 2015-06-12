var redis = require('redis');
var uuid = require('node-uuid');
var Event = function(){
	
	const EVENT_COUNT_KEY = '__EventCount';
	const SUBSCRIBER_LOCK_KEY = '__SubscriberLock';
	const DEBUG_MODE = true;

	var _redisSub  = redis.createClient(); // sub client *HAS* to be created first?!@
	var _redisMain = redis.createClient();
	
	this.publish = function(event,data) {
		if(!Array.isArray(event)) {
			event = [event];
		}
		data._pub_time = Date.now();
		data._event_id = uuid.v1();
		var strdata = JSON.stringify(_flatten(data));
		for(var i in event) {
			_redisMain.publish(event[i],strdata);
			_redisMain.hincrby(EVENT_COUNT_KEY,event[i],1);
		}

	};

	this.count = function(event,callback) {
		callback = typeof callback == 'function' ? callback : callback.count;
		_redisMain.hget(EVENT_COUNT_KEY,event,function(err,reply){
			if(err) throw err;
			return callback(event,reply);
		});
		return this;
	};

	this.flushCount = function(event) {
		if(event) {
			_redisMain.hdel(EVENT_COUNT_KEY,event);
		} else {
			_redisMain.del(EVENT_COUNT_KEY);
		}
		return this;
	};

	this.subscribe = function(event,callback) {
		callback = typeof callback == 'function' ? callback : callback.subscribe;
		
		_redisSub.subscribe(event);
		_redisSub.on('message',function(channel,message){
			if(channel == event) {
				callback(_parseEventData(data));
			}
		});
	};

	this.subscribeLock = function(event,callback) {			
		_redisSub.subscribe(event);
		var subscriber_id = uuid.v1();
		_redisSub.on('message',function(channel,message){
			if(channel == event) {
				var data = _parseEventData(message);

				data._subscriber_id = subscriber_id;

				var event_id = data._event_id;
				if(!event_id) throw new Error('Bad event_id: '+event_id);
				
				_redisMain.setnx(event_id,1,function(err,reply){
					if(err) throw err;
					if(reply) {
						_log('set a lock on',event_id,'for',subscriber_id);
						callback(data);
						// for slow clients & so redis doesn't get full
						setTimeout(function(){
							_redisMain.del(event_id);	
						},10000);

					} else {
						_log('event',event_id,'was locked for',subscriber_id);
					}
				});
			}
		});
	};

	// this.unsubscribe = function(event,callback) {

	// }

	var _parseEventData = function(data) {
		data = _unflatten(JSON.parse(data));
		data._sub_time = Date.now();
		return data;
	};
	var _unflatten = function(data) {
	    if (Object(data) !== data || Array.isArray(data)){
	        return data;
	    }

	    var result = {}, cur, prop, idx, last, temp;
	    for(var p in data) {
	        cur = result, prop = "", last = 0;
	        do {
	            idx = p.indexOf(".", last);
	            temp = p.substring(last, idx !== -1 ? idx : undefined);
	            cur = cur[prop] || (cur[prop] = (!isNaN(parseInt(temp)) ? [] : {}));
	            prop = temp;
	            last = idx + 1;
	        } while(idx >= 0);
	        cur[prop] = data[p];
	    }
	    return result[""];
	};
	
	var _flatten = function(data) {
	    var result = {};
	    function recurse (cur, prop) {
	        if (Object(cur) !== cur) {
	            result[prop] = cur;
	        } else if (Array.isArray(cur)) {
	             for(var i=0, l=cur.length; i<l; i++)
	                 recurse(cur[i], prop ? prop+"."+i : ""+i);
	            if (l == 0) {
	                result[prop] = [];
	            }
	        } else {
	            var isEmpty = true;
	            for (var p in cur) {
	                isEmpty = false;
	                recurse(cur[p], prop ? prop+"."+p : p);
	            }
	            if (isEmpty) {
	                result[prop] = {};
	            }
	        }
	    }
	    recurse(data, "");
	    return result;
	};

	var _incrEventCount = function(event) {
		_redisMain.hincrby(EVENT_COUNT_KEY,event,1);
	};	

	var _log = function(){
		if(DEBUG_MODE) {
			var args = Array.prototype.slice.apply(arguments);
			args.unshift(Date.now())
			console.log.apply(console,args);
		}
	};
};


module.exports = new Event();