import chalk from 'chalk';
import moment from 'moment';
import readline from "readline"

class Printer {
    log(message: string) {
        console.log(
            chalk.bgBlack.white(moment().format("MMMM HH:mm")), 
            chalk.bgGray.yellow(" INFO "), 
            chalk.white(message))
    }

    success(message: string) {
        console.log(
            chalk.bgBlack.white(moment().format("MMMM HH:mm")), 
            chalk.bgGray.green(" SUCC "), 
            chalk.white(message))
    }

    error(message: string) {
        console.log(
            chalk.bgBlack.white(moment().format("MMMM HH:mm")), 
            chalk.bgGray.red("ERROR "), 
            chalk.white(message))
    }

    question(title: string, message: string, defaultValue?: string): Promise<string> {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        console.log(title)
        if(defaultValue) {
            console.log()
            console.log("   ", chalk.white.bold(defaultValue))
            console.log()
        }
        
        return new Promise((resolve, reject) => {
            rl.question(`${chalk.green(" ? ")} ${chalk.white(message)}`, ans => {
                rl.close()
                if(ans) {
                    resolve(ans)
                } else {
                    reject()
                }
            })
            
        })
    }
}

const printer = new Printer()
export default printer