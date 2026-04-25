/**
 * Global Jest setup — silences Logger output during tests so the
 * test results aren't cluttered with mining/P2P log lines.
 */
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'info').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});
