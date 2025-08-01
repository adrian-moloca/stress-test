class AuthService {
  constructor(environment, options = {}) {
    this.environment = environment;
    this.token = null;
    this.tokenExpiry = null;
    this.options = options;
  }

  async loginDefaultSuperUser(force = false) {
    // Use hardcoded token for stress testing
    const hardcodedToken =
      process.env.STRESS_TEST_TOKEN ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Imx1Y2FAYW1idWZsb3cuY29tIiwic3ViIjoidXNlcl9XRHFRdkxlQ2tkOTl1R1FGaCIsInRlbmFudElkIjoiNjYwNDVlMjM1MGU4ZDQ5NWVjMTdiYmU5IiwiaWF0IjoxNzUzODgzNzc1fQ.o3Tg8RB12kt6Wq7JBnhqwmABRiIdLobnhHoy3kysntQ";

    this.token = hardcodedToken;
    this.tokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    console.log("✅ Using hardcoded token for stress testing");
    return this.token;
  }

  getToken() {
    return this.token;
  }

  isAuthenticated() {
    return !!this.token && Date.now() < (this.tokenExpiry || 0);
  }

  clearToken() {
    this.token = null;
    this.tokenExpiry = null;
  }
}

module.exports = AuthService;
