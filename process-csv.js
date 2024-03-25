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
        fs.createReadStream(filePath)
            .pipe(csvParser())
            .on("data", async (row) => {
                const websiteURL = "https://" + row["Domain"];
                totalRecords++;
                try {
                    const response = await runWappalyzer(websiteURL);
                    results.push(response);
                    console.log(`Processed URL: ${websiteURL}`);

                    const progress = Math.round(
                        (results.length / totalRecords) * 100
                    );
                    console.log(`Progress: ${progress}%`);

                    processedData.push({ original: row, processed: response });

                    // Convert and append data to CSV (if processedData has content)
                    if (processedData.length > 0) {
                        const csvData = processedData.map((item) => ({
                            domain: item.original["Domain"], // Extract domain from original data
                            technologies: item.processed.technologies
                                ? item.processed.technologies
                                      .map((tech) => tech.name)
                                      .join(", ")
                                : "", // Extract and join technology names (if any)
                        }));
                        const csv = json2csv.parse(csvData, { header: true });
                        const resultsFilePath = `results/results-${fileName}.csv`;
                        fs.appendFileSync(resultsFilePath, csv);
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
