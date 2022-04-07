const { join } = require("path");

class Class {
	constructor(name) {
		this.name = name;
	}

	init() {
		console.log("Class initialized.");
	}

	foo() {
		console.log("Current directory: " + __dirname);
	}
}

module.exports = Class;
