export class Logger {
    private static prefix: string = '';

    /**
     * Set the identity of this node (e.g. the port it's running on)
     */
    public static initialize(id: string | number): void {
        this.prefix = `[Node ${id}]`;
    }

    /**
     * Log an informational message with the node context
     */
    public static log(message: string, ...optionalParams: any[]): void {
        console.log(`${this.prefix} ${message}`, ...optionalParams);
    }

    /**
     * Log an error message with the node context
     */
    public static error(message: string, ...optionalParams: any[]): void {
        console.error(`${this.prefix} ERROR: ${message}`, ...optionalParams);
    }

    /**
     * Log a success/highlight message
     */
    public static info(message: string, ...optionalParams: any[]): void {
        console.info(`${this.prefix} INFO: ${message}`, ...optionalParams);
    }
}
