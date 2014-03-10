var bcrypt = require("bcrypt-nodejs");
var dgram  = require("dgram");
var os = require("os");
var util = require("util");
var event = new require("events").EventEmitter;

var setDefaultOptions = function(options)
{
	if(!options) options = {};
	var default_options = 
	{
		password            : "*#06#",
		port                : 23333,
		name                : os.hostname(),
		role                : "default",
		broadcast_addresses : ["255.255.255.255"],
		listen_address      : "0.0.0.0",
		validate_password   : true,
	};
	for(var key in default_options)
	{
		if(options[key] === undefined)
		{
			options[key] = default_options[key];
		}
	}
	return options;
}

var Seeker = function(options)
{
	this.options = options;
	this.client = dgram.createSocket("udp4");
	this.history = {};
	return this;
}

util.inherits(Seeker, event);

Seeker.prototype.genHeardbeatStr = function()
{
	var self = this;
	var salt = bcrypt.genSaltSync();
	var msg = {
		role      : self.options.role,
		name      : self.options.name,
		timestamp : new Date().getTime(),
		salt      : salt,
		hash      : bcrypt.hashSync(self.options.password, salt)
	}
	return JSON.stringify(msg);
}

Seeker.prototype.heartbeat = function(callback)
{
	callback = callback || function(){};
	var self = this;
    var str = self.genHeardbeatStr();
	var message = new Buffer(str);
	var client = self.client;
	try
	{
		client.setBroadcast(true);
	}
	catch(e)
	{
		console.log("Error: The client may be closed.");
		throw e;
	}
	for(var i in self.options.broadcast_addresses)
	{
		client.send(message, 0, message.length, self.options.port,self.options.broadcast_addresses[i], callback);
	}
}

Seeker.prototype.start = function()
{
	var self = this;
	var client = self.client;
	//........................................................................................
	var callback_message = function(message, remote)
	{
		var obj;
		try
		{
			obj = JSON.parse(message.toString());
		}
		catch(e){}
		if (!obj)
		{
			// not a JSON file
			return;
		}
		else
		{
			//console.log("message:",obj,"remote:",remote,"password:",self.options.password,"hash:",obj.hash);
			var result = bcrypt.compareSync(self.options.password, obj.hash);
			if (self.options.validate_password === false || !result)
			{
				// the password is not correct
				return;
			}
			else
			{
				if (self.history[obj.timestamp])
				{
					// we have received that message
					return;
				}
				else
				{
					var ret = 
					{
						role      : obj.role,
						name      : obj.name,
						timestamp : obj.timestamp,
						address   : remote.address,
						family    : remote.family,
						port      : remote.port,
						size      : remote.size
					};
					self.history[ret.timestamp] = ret;
					//console.log(ret);
					self.emit("connect", ret);
				}
			}
		}
		
	}
	///////////////////////////////////////////////////////////////////////////////////////////

	client.bind(self.options.port, self.options.listen_address);
	client.on("message", callback_message);
}

Seeker.prototype.stop = function()
{
	this.client.close();
}

exports.factory = function (options)
{
	options = setDefaultOptions(options);
	return new Seeker(options);
}