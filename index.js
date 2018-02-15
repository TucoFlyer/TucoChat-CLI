var fs = require('fs');
var url = require('url');
var readline = require('readline');

var chalk = require('chalk'); // colored text
var deasync = require('deasync'); // dea-async-ifyer
var request = require('request'); // http requests
var WebSocketClient = require('websocket').client; // websocket client

function log (text) { // log to stdout w/o newline
	process.stdout.write(text);
}

// create vote action "enum"
var VoteActionEnum = {"FORWARD":0, "BACKWARD":1, "LEFT":2, "RIGHT": 3};
Object.freeze(VoteActionEnum);

// create special action "enum"
var SpecialActionEnum = {"LOOK": 0}
Object.freeze(SpecialActionEnum);

// SETUP
log(chalk.blue("Checking CWD connection.txt..."));
var connectionFileExists = fs.existsSync("connection.txt"); // check if connection.txt exists in cwd
console.log(chalk.green(" OK!"));

var connectionFile; // path of connection file
if (connectionFileExists) {
	connectionFile = "connection.txt";
	console.log(chalk.green("CWD connection.txt found."));
} else {
	connectionFile = process.env.TUCOCHAT_CONNECTION_FILE
	console.log(chalk.yellow("CWD connection.txt not found, using TUCOCHAT_CONNECTION_FILE."));
}

log(chalk.blue("Reading connection.txt... (UTF-8)"));
var connectionFileContents = fs.readFileSync(connectionFile, "UTF-8"); // read connection file
console.log(chalk.green(" OK!"));

log(chalk.blue("Filtering QR Code from file..."));
var connectionFileLines = connectionFileContents.split("\n"); // split by newlines
var connectionAddr = connectionFileLines[0].trim(); // get 1st line and trim whitespaces from start to end
console.log(chalk.green(" OK!"));

log(chalk.blue(`Parsing "${connectionAddr}"...`));
var connectionURL = url.parse(connectionAddr); // parse URL with experimental url package
console.log(chalk.green(" OK!"));

log(chalk.blue(`Requesting WS addr from "${connectionURL.host}"...`));
var wsUrl = null;
request(`${connectionURL.protocol}//${connectionURL.host}/ws`, function (err, request, body) {
	if (err) {
		console.log(chalk.red(" FAIL!"));
		throw err;
	}
	console.log(chalk.green(" OK!"));
	console.log(chalk.magenta(`Response code: ${request.statusCode}`));
	wsUrl = JSON.parse(body).uri;
	console.log(chalk.green(`WS URL: ${wsUrl}`));
});

deasync.loopWhile(function(){return wsUrl == null}); // wait until async request finishes

log(chalk.blue("Creating readline interface..."));
var rl = readline.createInterface({
   input: process.stdin,
   output: process.stdout
});
console.log(chalk.green(" OK!"));

function cli() {
	rl.question('# ', (answer) => {
		var sanitizedAnswer = answer.trim().toLowerCase();

		if (sanitizedAnswer == "help") {
			console.log("Commands:");
			console.log("\tvote <direction> - Vote to move in specified direction. (forward, backward, left, right)");
			console.log("\taction <action> <data> - Perform special action with specified data. (ex. 'action look target')");
			console.log("\tactionCooldown <action> <cooldownms> - Set action cooldown. (ex. 'actionCooldown look 5000')");
			console.log("\tvoteCycle <intervalms> - Set vote cycle interval. (ex. 'voteCycle 5000')");
			console.log("\tvoteCycleOn - Enable vote cycle and voting.");
			console.log("\tvoteCycleOff - Disable vote cycle and voting.");
			console.log("\tactionsOn - Enable special actions.");
			console.log("\tactionsOff - Disable special actions.");
			console.log("\tactionOn <action> - Enable specified action. (ex. 'actionOn look')");
			console.log("\tactionOff <action> - Disable specified action. (ex. 'actionOff look')");
		} else if (sanitizedAnswer == "exit") {
			console.log("Goodbye!");
			// properly shutdown websocket, etc.
			rl.close();
			process.exit(0);
		} else if (sanitizedAnswer.startsWith("vote ")) {
			var direction = sanitizedAnswer.split(" ")[1];
			console.log(chalk.magenta(`Vote attempted in direction "${direction}". (${VoteActionEnum[direction.toUpperCase()]})`));
		} else if (sanitizedAnswer.startsWith("action ")) {
			var tokens = sanitizedAnswer.split(" ");
			var action = tokens[1];
			var data = sanitizedAnswer.substring((tokens[0] + " " + action + " ").length);
			console.log(chalk.magenta(`Action attempted: "${action}" with data "${data}". (${SpecialActionEnum[action.toUpperCase()]})`));
		} else if (sanitizedAnswer.startsWith("actioncooldown ")) {
			var tokens = sanitizedAnswer.split(" ");
			var action = tokens[1];
			var cooldown = parseInt(tokens[2]);
			console.log(chalk.magenta(`Action cooldown change attempted on "${action}" to a cooldown length of ${cooldown/1000}s. (${cooldown}ms)`));
		} else if (sanitizedAnswer.startsWith("votecycle ")) {
			var interval = parseInt(sanitizedAnswer.split(" ")[1]);
			console.log(chalk.magenta(`Vote cycle change attempted to an interval of ${interval/1000}s. (${interval}ms)`));
		} else if (sanitizedAnswer == "votecycleon") {
			console.log(chalk.magenta(`Attempted to turn on vote cycle.`));
		} else if (sanitizedAnswer == "votecycleoff") {
			console.log(chalk.magenta(`Attempted to turn off vote cycle.`));
		} else if (sanitizedAnswer == "actionson") {
			console.log(chalk.magenta(`Attempted to turn on actions.`));
		} else if (sanitizedAnswer == "actionsoff") {
			console.log(chalk.magenta(`Attempted to turn off actions.`));
		} else if (sanitizedAnswer.startsWith("actionon ")) {
			var action = sanitizedAnswer.split(" ")[1];
			console.log(chalk.magenta(`Attempted to turn on action "${action}". (${SpecialActionEnum[action.toUpperCase()]})`));
		} else if (sanitizedAnswer.startsWith("actionoff ")) {
			var action = sanitizedAnswer.split(" ")[1];
			console.log(chalk.magenta(`Attempted to turn off action "${action}". (${SpecialActionEnum[action.toUpperCase()]})`));
		} else {
			console.log(`Unknown command "${sanitizedAnswer}". Type 'help' to see the list of commands.`);
		}

		cli();
	});
}

cli();