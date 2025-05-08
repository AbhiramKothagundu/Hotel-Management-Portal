const fs = require("fs");
const path = require("path");

const logDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

const logStream = fs.createWriteStream(
    path.join(__dirname, "../logs/requests.log"),
    { flags: "a" }
);

module.exports = (req, res, next) => {
    const timestamp = new Date().toISOString();
    const log = `[${timestamp}] ${req.method} ${req.url}\n`;
    logStream.write(log);
    next();
};
