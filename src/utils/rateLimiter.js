class RateLimiter {
  constructor({ windowMs = 60000, maxRequests = 10 }) {
    this.windowMs = windowMs; // 1 minute default
    this.maxRequests = maxRequests;
    this.requests = [];
  }

  // Add request and clean old ones
  addRequest() {
    const now = Date.now();
    this.requests = this.requests.filter(req => now - req < this.windowMs);
    this.requests.push(now);
  }

  // Check if we can make a request
  canRequest() {
    this.cleanup();
    return this.requests.length < this.maxRequests;
  }

  // Clean up old requests
  cleanup() {
    const now = Date.now();
    this.requests = this.requests.filter(req => now - req < this.windowMs);
  }

  // Get remaining requests
  getRemainingRequests() {
    this.cleanup();
    return this.maxRequests - this.requests.length;
  }

  // Get time until next request
  getTimeUntilNextRequest() {
    this.cleanup();
    if (this.requests.length < this.maxRequests) return 0;
    const oldestRequest = this.requests[0];
    const now = Date.now();
    return this.windowMs - (now - oldestRequest);
  }
}

// Export a singleton instance
const rateLimiter = new RateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 5    // Maximum 5 requests per minute
});

export default rateLimiter;
