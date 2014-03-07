var dgram = require('dgram');

var broadcastAddress = "127.255.255.255";
//var broadcastAddress = "192.168.1.255";

var client = dgram.createSocket("udp4");
client.bind();
client.on("listening", function () {
    client.setBroadcast(true);
    var broadCast = function(str){
    	str = str || "Hello from dewin";
    	var message = new Buffer(str);
    		client.send(message, 0, message.length, 12345, broadcastAddress, function(err, bytes) {
        		console.log("Sent",err,bytes);
        		//client.close();
    	});
    }
    setInterval(broadCast,1000);
});