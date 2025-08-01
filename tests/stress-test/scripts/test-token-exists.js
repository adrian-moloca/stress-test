const dotenv = require('dotenv');
dotenv.config();
const getAuthToken = () => {
  console.log("Fetching auth token for stress test...", process.env.STRESS_TEST_TOKEN);
  return process.env.STRESS_TEST_TOKEN || "stress-test-token";
};

getAuthToken();
