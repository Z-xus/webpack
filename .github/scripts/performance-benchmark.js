const path = require("path");
const fs = require("fs");
const Benchmark = require("benchmark");
const webpack = require("../..");

const fixtures = path.join(__dirname, "..", "..", "test", "fixtures");
const outputPath = path.join(__dirname, "..", "..", "test", "js");

// Ensure output path exists
fs.mkdirSync(outputPath, { recursive: true });

async function runBenchmark(config) {
	return new Promise((resolve, reject) => {
		const start = process.hrtime.bigint();

		webpack(config, (err, stats) => {
			if (err) {
				reject(err);
				return;
			}

			const end = process.hrtime.bigint();
			const durationMs = Number(end - start) / 1_000_000;

			resolve(durationMs);
		});
	});
}

async function performanceTest(outputFilename = "performance-report.json") {
	const performanceReport = {
		timestamp: new Date().toISOString(),
		tests: {}
	};

	const benchmarkConfigs = [
		{
			name: "Normal Build",
			config: {
				context: fixtures,
				entry: "./0.js",
				output: {
					path: outputPath,
					filename: "bundle.js"
				}
			}
		},
		{
			name: "Eval Dev Build",
			config: {
				context: fixtures,
				entry: "./1.big.js",
				output: {
					path: outputPath,
					filename: "bundle.js"
				},
				devtool: "eval"
			}
		},
		{
			name: "Sourcemap Build",
			config: {
				context: fixtures,
				entry: "./2.big.js",
				output: {
					path: outputPath,
					filename: "bundle.js"
				},
				devtool: "source-map"
			}
		}
	];

	// Run each benchmark configuration multiple times
	for (const { name, config } of benchmarkConfigs) {
		const durations = [];

		for (let i = 0; i < 5; i++) {
			// Run 5 times for statistical significance
			try {
				const duration = await runBenchmark(config);
				durations.push(duration);
			} catch (error) {
				console.error(`Error in ${name} (run ${i + 1}):`, error);
			}
		}

		// Calculate average and standard deviation
		const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
		const stdDeviation = Math.sqrt(
			durations
				.map(x => Math.pow(x - avgDuration, 2))
				.reduce((a, b) => a + b, 0) / durations.length
		);

		performanceReport.tests[name] = {
			avg_duration: avgDuration,
			std_deviation: stdDeviation,
			runs: durations
		};
	}

	// Ensure .github/performance-scripts directory exists
	fs.mkdirSync(path.join(__dirname), { recursive: true });

	// Write performance report
	const reportPath = path.join(__dirname, outputFilename);
	fs.writeFileSync(reportPath, JSON.stringify(performanceReport, null, 2));
	console.log(`Performance report generated: ${reportPath}`);

	return performanceReport;
}

// If run directly
if (require.main === module) {
	const outputFilename = process.argv[2] || "performance-report.json";
	performanceTest(outputFilename).catch(console.error);
}

module.exports = performanceTest;
