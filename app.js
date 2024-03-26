const express = require("express");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const runWappalyzer = require("./src/cli");
const { exec } = require("child_process");
const bodyParser = require("body-parser");
const redis = require("redis");

const app = express();
const processingQueue = {};
// Set EJS as the view engine
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
const client = redis.createClient();

// Multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        const fileId = uuidv4(); // Generate unique ID for the file
        cb(null, `${fileId}.csv`);
    },
});

const upload = multer({ storage: storage }).single("file");
// const processingQueue = new Bull('processing-queue');

app.post("/upload", async (req, res) => {
    upload(req, res, function (err) {
        if (err) {
            console.error(err);
            return res.status(500).send("Error uploading file");
        }

        if (!req.file) {
            return res.status(400).send("No file provided");
        }
        // Retrieve file name and file path
        const fileName = req.file.filename;
        const filePath = req.file.path;

        // Start background process
        const processId = startBackgroundProcess(fileName, filePath);

        // Store process ID for tracking progress
        processingQueue[fileName] = { progress: 0 };

        res.json({
            message: "CSV uploaded successfully!",
            fileName,
            filePath,
            processId,
        });
    });
});

// Start background process
function startBackgroundProcess(fileName, filePath) {
    const processId = uuidv4(); // Generate unique ID for the process
    const process = exec(`node process-csv.js ${fileName} ${filePath}`);

    // Set maximum listeners to prevent EventEmitter memory leaks
    process.setMaxListeners(20);

    process.stdout.on("data", (data) => {
        console.log(`stdout: ${data}`);
        // Update progress
        if (data.includes("Progress:")) {
            const progress = parseInt(data.split(":")[1]);
            if (processingQueue[fileName]) {
                processingQueue[fileName].progress = progress;
            }
        }
    });

    process.stderr.on("data", (data) => {
        console.error(`stderr: ${data}`);
    });

    process.on("close", (code) => {
        console.log(`child process exited with code ${code}`);
        delete processingQueue[fileName]; // Remove from processing queue on completion
    });

    return processId;
}

// Route to check progress
app.get("/progress/:fileName", (req, res) => {
    const fileName = req.params.fileName;
    const progress = processingQueue[fileName]
        ? processingQueue[fileName].progress
        : -1;
    res.json({ fileName, progress });
});

// Define a route to render the EJS template
app.get("/", (req, res) => {
    res.render("index");
});

// Define a basic GET request handler
app.get("/tech-stack", (req, res) => {
    res.render("example");
});

app.get("/bulk-stack", (req, res) => {
    res.render("upload");
});

app.get("/contact-us", (req, res) => {
  res.render("contact");
});

function generateUniqueId() {
    return Math.random().toString(36).substring(2, 10);
}

app.post("/tech-stack", async (req, res) => {
    try {
        const website_url = req.body.website;
        const jobId = generateUniqueId();

        client.set(jobId, "processing");

        runWappalyzer(website_url).then(results => {
            client.set(jobId, JSON.stringify(results));
        });

        const results = {
            url: website_url,
            technologies: technologies,
        };

        res.render("example", { jobId });
    } catch (error) {
        res.render("example", { error: error.message || String(error) });
    }
});

app.get("/progress/:jobId", (req, res) => {
    const { jobId } = req.params;

    client.get(jobId, (err, result) => {
        if (err) {
            res.status(500).send({ error: "Internal server error" });
        } else if (!result) {
            res.status(404).send({ error: "Job not found" });
        } else if (result === "processing") {
            res.send({ progress: 0 });
        } else {
            res.send({ progress: 100 });
        }
    });
});

app.get("/results/:jobId", (req, res) => {
    const { jobId } = req.params;
    client.get(jobId, (err, result) => {
        if (err) {
            res.status(500).send({ error: "Internal server error" });
        } else if (!result) {
            res.status(404).send({ error: "Job not found" });
        } else {
            res.send(JSON.parse(result));
        }
    });
});

const port = 8888;

app.listen(port, () => {
    console.log(`Server running at ${port}`);
});
