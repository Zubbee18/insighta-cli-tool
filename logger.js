import chalk from 'chalk'

/**
 * Colorful logging utility for CLI
 */
export const logger = {
    /**
     * Success message (green with checkmark)
     */
    success: (message, ...args) => {
        console.log(chalk.green('✓'), chalk.green(message), ...args)
    },

    /**
     * Error message (red with X)
     */
    error: (message, ...args) => {
        console.error(chalk.red('✗'), chalk.red(message), ...args)
    },

    /**
     * Warning message (yellow with warning symbol)
     */
    warning: (message, ...args) => {
        console.log(chalk.yellow('⚠'), chalk.yellow(message), ...args)
    },

    /**
     * Info message (cyan with info symbol)
     */
    info: (message, ...args) => {
        console.log(chalk.cyan('ℹ'), chalk.cyan(message), ...args)
    },

    /**
     * Debug/log message (gray)
     */
    debug: (message, ...args) => {
        console.log(chalk.gray('→'), chalk.gray(message), ...args)
    },

    /**
     * Highlight message (bold white)
     */
    highlight: (message, ...args) => {
        console.log(chalk.bold.white(message), ...args)
    },

    /**
     * Plain message with custom color
     */
    custom: (color, message, ...args) => {
        console.log(chalk[color](message), ...args)
    }
}
