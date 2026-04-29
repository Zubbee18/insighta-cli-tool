import chalk from 'chalk'

/**
 * Simple loading spinner for CLI operations
 */
export class Spinner {
    constructor(text = 'Loading...') {
        this.text = text
        this.frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
        this.currentFrame = 0
        this.interval = null
        this.isSpinning = false
    }

    start(text) {
        if (text) this.text = text
        
        // Hide cursor
        process.stdout.write('\x1B[?25l')
        
        this.isSpinning = true
        this.currentFrame = 0
        
        this.interval = setInterval(() => {
            const frame = this.frames[this.currentFrame]
            process.stdout.write(`\r${chalk.cyan(frame)} ${chalk.gray(this.text)}`)
            this.currentFrame = (this.currentFrame + 1) % this.frames.length
        }, 80)
    }

    update(text) {
        this.text = text
    }

    succeed(text) {
        this.stop()
        console.log(`${chalk.green('✓')} ${chalk.green(text || this.text)}`)
    }

    fail(text) {
        this.stop()
        console.log(`${chalk.red('✗')} ${chalk.red(text || this.text)}`)
    }

    warn(text) {
        this.stop()
        console.log(`${chalk.yellow('⚠')} ${chalk.yellow(text || this.text)}`)
    }

    info(text) {
        this.stop()
        console.log(`${chalk.cyan('ℹ')} ${chalk.cyan(text || this.text)}`)
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval)
            this.interval = null
        }
        
        if (this.isSpinning) {
            process.stdout.write('\r\x1B[K') // Clear line
            this.isSpinning = false
        }
        
        // Show cursor
        process.stdout.write('\x1B[?25h')
    }
}

/**
 * Create a new spinner instance
 */
export function createSpinner(text) {
    return new Spinner(text)
}
