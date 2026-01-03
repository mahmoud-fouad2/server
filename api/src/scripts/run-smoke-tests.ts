/**
 * CLI Script to run smoke tests
 * Usage: node dist/scripts/run-smoke-tests.js [businessId]
 */
import botSmokeTests from '../tests/bot-smoke-tests.js';
import fs from 'fs';
import path from 'path';
import logger from '../utils/logger.js';

async function main() {
  const businessId = process.argv[2];

  try {
    logger.info('🚀 Starting Bot Smoke Tests...');

    let suites;
    if (businessId) {
      logger.info(`Testing specific business: ${businessId}`);
      const result = await botSmokeTests.runBusinessTests(businessId);
      suites = [result];
    } else {
      logger.info('Testing all businesses...');
      suites = await botSmokeTests.runAllBusinessTests();
    }

    // Generate HTML report
    const html = botSmokeTests.generateHTMLReport(suites);
    const reportPath = path.join(process.cwd(), 'smoke-test-report.html');
    fs.writeFileSync(reportPath, html);

    logger.info(`📊 Report generated: ${reportPath}`);

    // Log summary
    const totalPassed = suites.reduce((sum, s) => sum + s.passedTests, 0);
    const totalTests = suites.reduce((sum, s) => sum + s.totalTests, 0);
    const passRate = Math.round((totalPassed / totalTests) * 100);

    console.log('\n' + '='.repeat(50));
    console.log(`✅ Tests Passed: ${totalPassed}/${totalTests} (${passRate}%)`);
    console.log('='.repeat(50) + '\n');

    // Exit with error if any tests failed
    if (totalPassed < totalTests) {
      process.exit(1);
    }

    process.exit(0);
  } catch (error: any) {
    logger.error('Smoke tests failed:', error);
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
