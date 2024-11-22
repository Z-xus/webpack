const fs = require("fs");
const path = require("path");

function comparePerformance(baselineReport, prReport) {
	const analysis = {
		overall_status: "neutral",
		tests: {}
	};

	const baselineTests = JSON.parse(
		fs.readFileSync(baselineReport, "utf8")
	).tests;
	const prTests = JSON.parse(fs.readFileSync(prReport, "utf8")).tests;

	for (const [testName, baselineData] of Object.entries(baselineTests)) {
		const prData = prTests[testName];

		// Skip if baseline or PR data is not available
		if (!baselineData || !prData) {
			analysis.tests[testName] = {
				status: "error",
				message: "Unable to compare due to missing data"
			};
			analysis.overall_status = "error";
			continue;
		}

		const percentChange =
			((prData.avg_duration - baselineData.avg_duration) /
				baselineData.avg_duration) *
			100;

		if (Math.abs(percentChange) > 10) {
			analysis.overall_status = "critical";
			analysis.tests[testName] = {
				status: "critical",
				baseline_avg_duration: baselineData.avg_duration,
				pr_avg_duration: prData.avg_duration,
				baseline_std_deviation: baselineData.std_deviation,
				pr_std_deviation: prData.std_deviation,
				percent_change: percentChange.toFixed(2)
			};
		} else if (Math.abs(percentChange) > 5) {
			analysis.tests[testName] = {
				status: "warning",
				baseline_avg_duration: baselineData.avg_duration,
				pr_avg_duration: prData.avg_duration,
				baseline_std_deviation: baselineData.std_deviation,
				pr_std_deviation: prData.std_deviation,
				percent_change: percentChange.toFixed(2)
			};
		} else {
			analysis.tests[testName] = {
				status: "neutral",
				baseline_avg_duration: baselineData.avg_duration,
				pr_avg_duration: prData.avg_duration,
				baseline_std_deviation: baselineData.std_deviation,
				pr_std_deviation: prData.std_deviation,
				percent_change: percentChange.toFixed(2)
			};
		}
	}

	return analysis;
}

function generateMarkdownReport(analysis) {
	let report = `## Performance Impact Report

### Overall Status: ${analysis.overall_status.toUpperCase()}

| Test Name | Baseline Avg Duration (ms) | PR Avg Duration (ms) | Baseline Std Dev | PR Std Dev | Change (%) | Status |
|-----------|----------------------------|---------------------|-----------------|------------|------------|--------|
`;

	for (const [testName, testData] of Object.entries(analysis.tests)) {
		report += `| ${testName} | ${testData.baseline_avg_duration?.toFixed(2) || "N/A"} | ${testData.pr_avg_duration?.toFixed(2) || "N/A"} | ${testData.baseline_std_deviation?.toFixed(2) || "N/A"} | ${testData.pr_std_deviation?.toFixed(2) || "N/A"} | ${testData.percent_change || "N/A"}% | ${testData.status.toUpperCase()} |\n`;
	}

	return report;
}

function main() {
	const baselineReport = process.argv[2];
	const prReport = process.argv[3];

	if (!baselineReport || !prReport) {
		console.error("Please provide baseline and PR performance reports");
		process.exit(1);
	}

	const analysis = comparePerformance(baselineReport, prReport);
	const markdownReport = generateMarkdownReport(analysis);

	// Ensure output directory exists
	fs.mkdirSync(path.dirname(path.join(__dirname, "performance-report.md")), {
		recursive: true
	});

	fs.writeFileSync(
		path.join(__dirname, "performance-report.md"),
		markdownReport
	);

	// Exit with non-zero status if critical performance regression detected
	process.exit(analysis.overall_status === "critical" ? 1 : 0);
}

main();
