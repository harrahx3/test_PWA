var express = require('express');
var app = express();
var port = process.env.PORT || 3000;
const http = require("http");
const https = require("https");
const fs = require("fs");
var favicon = require('serve-favicon');
const webpush = require('web-push');

const path = require('path');
const bodyParser = require("body-parser");

//var https = require('follow-redirects').https;
//var fs = require('fs');

console.log("\n sg tgtg start");
console.log(Date());
console.log("\n");

fetch_tgtg_fav = function () {

	var now = new Date();

	if (now.getHours()<9){
		return
	}

	var options = {
		'method': 'POST',
		'hostname': 'apptoogoodtogo.com',
		'path': '/api/item/v6/',
		'headers': {
			'Authorization': 'Bearer e30.eyJzdWIiOiI5MTczMTI2IiwiZXhwIjoxNjEwNDAwMDcxLCJ0IjoiVVZnUkI0cEdURENhbTlUaVFKNFVfZzowOjEifQ.3zrv59-EWxPmcJMifCgGO3_my5M7pEVS4C-7JQ7EJok',
			'Content-Type': 'application/json'
		},
		'maxRedirects': 20
	};

	var req = https.request(options, function (res) {
		var chunks = [];

		res.on("data", function (chunk) {
			chunks.push(chunk);
		});

		res.on("end", function (chunk) {
			console.log('\n'+Date()+'\n');
			var body = Buffer.concat(chunks);
			console.log("response body:");
			console.log(body.toString().substring(0, 50));
			items = JSON.parse(body.toString()).items;
			//console.log(items[0].display_name);
			stores_available = "";
			if (items) {
				for (let index = 0; index < items.length; index++) {
					const store = items[index];
					console.log(store.display_name + " => " + store.items_available);
					if (store.items_available) {
						stores_available = stores_available + "; " + store.display_name;
						if (store.display_name.split(" ")[0] == "Pomponette") {
							subs.forEach(pushSubscription => {
								webpush.sendNotification(pushSubscription, JSON.stringify({ title: 'fav tgtg available', body: "Panier Pomponette à sg !" }));
							});
						}
					}
				}
			} else if (JSON.parse(body.toString()).status == 401) {
							subs.forEach(pushSubscription => {
								webpush.sendNotification(pushSubscription, JSON.stringify({ title: 'tgtg error !', body: JSON.parse(body.toString()).message }));
							});
			}
			/*subs.forEach(pushSubscription => {
				webpush.sendNotification(pushSubscription, JSON.stringify({ title: 'fav tgtg available', body: stores_available }));
			});*/
		});

		res.on("error", function (error) {
			console.error(error);
		});
	});

	var postData = JSON.stringify({ "user_id": "9173126", "origin": { "latitude": 45.75190208790065, "longitude": 4.830272620720394 }, "radius": 30, "page_size": 100, "page": 1, "discover": false, "favorites_only": true, "item_categories": [], "diet_categories": [], "pickup_earliest": null, "pickup_latest": null, "search_phrase": null, "with_stock_only": false, "hidden_only": false, "we_care_only": false });

	req.write(postData);

	req.end();
}

setInterval(fetch_tgtg_fav, 20 * 60 * 1000);



//connection.end();

app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(bodyParser.json());


app.use('/css', express.static(path.join(__dirname, 'public', 'css')));
app.use('/js', express.static(path.join(__dirname, 'public', 'js')));
app.use('/vendor', express.static(path.join(__dirname, 'public', 'vendor')));
app.use('/img', express.static(path.join(__dirname, 'public', 'img')));
app.use('/pwa', express.static(path.join(__dirname, 'public', 'pwa')));
app.use('/html', express.static(path.join(__dirname, 'public', 'html')));
app.use('/sw.js', express.static(path.join(__dirname, 'sw.js')));


app.use(favicon(path.join(__dirname, 'public', 'img', 'favicon.ico')));

app.set('view engine', 'ejs');

var subs = [];

// read JSON object from file
fs.readFile('subs.json', 'utf-8', (err, data) => {
    if (err) {
        throw err;
    }

    // parse JSON object
    subs = JSON.parse(data.toString());

    // print JSON object
    console.log("subs from subs.json: ")
    console.log(subs);
});

// VAPID keys should only be generated only once.
//const vapidKeys = webpush.generateVAPIDKeys();
const vapidKeys = {
	publicKey: 'BDNJ4GGTFcWDLZdNtnkK-sQbs9L1KQd3J9pncDvIA_wcJTXjFtlnuJ9H2V4NXCoPM55eJK_3kCz8Tbz5IMKHIJU',
	privateKey: 'g4VOzWzRpp_WIUNP0H-RcHclIj5HNLa6bGE21N043cA'
}
console.log(vapidKeys);

//webpush.setGCMAPIKey('<Your GCM API Key Here>');
webpush.setVapidDetails(
	'mailto:hyacinthe.menard@ecl19.ec-lyon.fr',
	vapidKeys.publicKey,
	vapidKeys.privateKey
);

app.get('/', function (req, res) {
	//res.sendStatus(200);

	res.status(200).sendFile("html/home.html", { root: "./public" });
});

app.post('/subscribe', (req, res) => {
	console.log('/subscribe');
	console.log(req.body);
	var addsub = true;
	if (req.body.content) {
	subs.forEach(sub => {
		if (JSON.stringify(sub) == req.body.content){
			addsub = false;
		}
	});
	if (addsub) {
		subs.push(JSON.parse(req.body.content));

		// convert JSON object to string
		const data = JSON.stringify(subs);
		// write JSON string to a file
		fs.writeFile('subs.json', data, (err) => {
			if (err) {
		        	throw err;
			}
			console.log("subs JSON data is saved.");
		});
	}
	}
	res.send(req.body);
});

app.post('/broadcast_notif', (req, res) => {
	console.log('/broadcast_notif');
	console.log(req.body);
	console.log(subs);
	subs.forEach(pushSubscription => {
		webpush.sendNotification(pushSubscription, JSON.stringify({title: "tgtg broadcast notif", body: "broadcast notif"}));
	});
});

app.get('/autrepage', function (req, res) {
	var html = "<html>"
	html += "<head>"
	html += "<title>Page de formulaire</title>"
	html += "</head>"
	html += "<body>"
	html += "<form action='/formulaire' method='POST'>"
	html += "First Name: <input type='text' name='first_name'> <br>"
	html += "Last Name: <input type='text' name='last_name'> <br>"
	html += "<input type='submit' value='submit'>"
	html += "</form>"
	html += "</body>"
	html += "</html>"

	res.send(html);
});

app.post('/formulaire', function (req, res) {
	response = {
		first_name: req.body.first_name,
		last_name: req.body.last_name
	};
	console.log(response);

	//convert the response in JSON format
	res.end(JSON.stringify(response));
});



app.post('/login', function (req, res) {
	console.log(req.body);
	if (req.body.username == "Eclair" && req.body.password == "password") {
		res.json({ success: true });
	} else {
		res.json({ success: false });
	};
});


var server = https.createServer({ key: fs.readFileSync('ssl/server.key'), cert: fs.readFileSync('ssl/server.crt') }, app);
//var server = http.createServer(app);

//app.listen(port);

server.listen(process.env.PORT || 443, () => {
	console.log(`App Started on PORT ${process.env.PORT || 443}`);
});
