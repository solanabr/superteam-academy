import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';
import fs from 'fs';
import path from 'path';

/**
 * Run Lighthouse audit programmatically
 * Usage: npx ts-node scripts/lighthouse-audit.ts [url]
 */
async function runAudit() {
    const url = process.argv[2] || 'http://localhost:3000/en';
    console.log(`Starting Lighthouse audit for: ${url}`);

    const chrome = await launch({ chromeFlags: ['--headless'] });

    const options = {
        logLevel: 'info' as const,
        output: ['html', 'json'] as const,
        port: chrome.port,
    };

    try {
        const runnerResult = await lighthouse(url, options as any);

        if (!runnerResult) {
            throw new Error('Lighthouse audit failed to return a result');
        }

        const reportHtml = runnerResult.report[0];
        const reportJson = runnerResult.report[1];

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportDir = path.join(process.cwd(), 'reports', 'lighthouse');

        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }

        const htmlPath = path.join(reportDir, `report-${timestamp}.html`);
        const jsonPath = path.join(reportDir, `report-${timestamp}.json`);

        fs.writeFileSync(htmlPath, reportHtml);
        fs.writeFileSync(jsonPath, reportJson);

        console.log('Audit complete!');
        console.log(`HTML Report: ${htmlPath}`);
        console.log(`JSON Report: ${jsonPath}`);
        console.log('Performance score was', (runnerResult.lhr.categories.performance.score || 0) * 100);

    } catch (error) {
        console.error('Lighthouse audit failed:', error);
    } finally {
        await chrome.kill();
    }
}

runAudit();
