const fs = require("fs");
const csvParser = require("csv-parser");
const json2csv = require("json2csv");
const runWappalyzer = require("./src/cli");

// Process CSV file
function processCSV(fileName, filePath) {
    let totalRecords = 0;
    const results = [];
    const processedData = [];

    return new Promise((resolve, reject) => {
        let headerFound = false;
        fs.createReadStream(filePath, { encoding: 'utf-8' })
            .pipe(csvParser({ headers: ['Domains'] }))
            .on("data", async (row) => {
                let websiteURL = row.Domains.trim();

                if (!websiteURL.startsWith("http://") && !websiteURL.startsWith("https://")) {
                    websiteURL = "https://" + websiteURL;
                }
    
                totalRecords++;
                try {
                    const response = await runWappalyzer(websiteURL);
                    results.push(response);
                    console.log(`Processed URL: ${websiteURL}`);

                    const progress = Math.round(
                        (results.length / totalRecords) * 100
                    );
                    console.log(`Progress: ${progress}%`);

                    processedData.push(response);

                    if (processedData.length > 0) {
                        const rowData = processedData.map((item) => ({
                            Domains: websiteURL,
                            Technologies: item.technologies.map((tech) => tech.name).join(", ")
                        }));
                        const csvContent = json2csv.parse(rowData, { header: true });
                        const resultsFilePath = `results/results-${fileName}.csv`;

                        if (!fs.existsSync(resultsFilePath)) {
                            fs.writeFileSync(resultsFilePath, csvContent + '\n', 'utf-8');
                        } else {
                            fs.appendFileSync(resultsFilePath, csvContent.split('\n').slice(1).join('\n') + '\n', 'utf-8');
                        }
                        processedData.length = 0; // Clear processedData for next record
                    }
                } catch (error) {
                    console.error(
                        `Error processing URL ${websiteURL}: ${
                            error.message || String(error)
                        }`
                    );
                }
            })
            .on("end", () => {
                console.log("Total Records:", totalRecords);
                resolve(processedData); // Resolve with final processed data (optional)
            })
            .on("error", (error) => {
                reject(error);
            });
    });
}

// Get command line arguments
const [, , fileName, filePath] = process.argv;

// Start processing CSV file
processCSV(fileName, filePath)
    .then((results) => {
        console.log("Processing completed:", results);
    })
    .catch((error) => {
        console.error("Error processing CSV:", error);
    });
