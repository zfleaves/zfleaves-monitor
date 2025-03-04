import { _global, _support } from './global';
const PREFIX = 'Monitor Logger'

export class Logger {
    private enabled = false;
    private _console: Console = {} as Console;
    constructor() {
        _global.console = console || _global.console;
        if (console || _global.console) {
            const logType = ['log', 'debug', 'info', 'warn', 'error', 'assert'];
            logType.forEach(type => {
                if (!(type in _global.console)) return
                this._console[type] = _global.console[type];
            })
        }
    }

    disable(): void {
        this.enabled = false;
    }

    bindOptions(debug: boolean): void {
        this.enabled = debug ? true: false;
    }

    enable(): void {
        this.enabled = true;
    }

    getEnableStatus(): boolean {
        return this.enabled;
    }

    log(...args: any[]): void {
        if (!this.enabled) return;
        try {
            this._console.log(`${PREFIX}[Log]:`, ...args);
        } catch (error) {
            console.error('Failed to log message:', error);
        }
    }

    warn(...args: any[]): void {
        if (!this.enabled) return;
        try {
            this._console.warn(`${PREFIX}[Warn]:`,...args);
        } catch (error) {
            console.error('Failed to log message:', error);
        }
    }

    error(...args: any[]): void {
        if (!this.enabled) return;
        try {
            this._console.error(`${PREFIX}[Error]:`,...args); 
        }  catch (error) {
            console.error('Failed to log message:', error); 
        }
    }
}

const logger = _support.logger || (_support.logger = new Logger());

export { logger };