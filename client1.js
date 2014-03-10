var client1 = require("../auto-plugin").factory();

client1.start();
setTimeout(client1.heartbeat.bind(client1),1000);
//............................................................
var callback_connect = function (info)
{
	console.log("A new device is connected from: ",JSON.stringify(info, null, 4));
	client1.stop();
}

client1.on("connect",callback_connect);