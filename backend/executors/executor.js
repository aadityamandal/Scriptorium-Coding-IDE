const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

export default async function executeCode(language, code, stdin = "") {
    const languageConfigs = {
        python: {
            image: "code-executor-python",
            fileName: `program.py`,
            dockerfilePath: "./user_code",
            command: "python3 program.py < ./user_code/input.txt"
        },
        javascript: {
            image: "code-executor-javascript",
            fileName: `program.js`,
            dockerfilePath: "./user_code",
            command: "node program.js < ./user_code/input.txt"
        },
        php: {
            image: "code-executor-php",
            fileName: `program.php`,
            dockerfilePath: "./user_code",
            command: "php program.php < ./user_code/input.txt"
        },
        swift: {
            image: "code-executor-swift",
            fileName: `program.swift`,
            dockerfilePath: "./user_code",
            command: "swift program.swift < ./user_code/input.txt"
        },
        bash: {
            image: "code-executor-bash",
            fileName: `script.sh`,
            dockerfilePath: "./user_code",
            command: "bash script.sh < ./user_code/input.txt"
        },
        julia: {
            image: "code-executor-julia",
            fileName: `program.jl`,
            dockerfilePath: "./user_code",
            command: "julia program.jl < ./user_code/input.txt"
        },
        haskell: {
            image: "code-executor-haskell",
            fileName: `program.hs`,
            dockerfilePath: "./user_code",
            command: "runhaskell program.hs < ./user_code/input.txt"
        },
        cpp: {
            image: "code-executor-cpp",
            fileName: `temp.cpp`,
            dockerfilePath: "./executors/cpp",
            imagePath: "./executors/cpp",
            inputpath: "./user_code",
            command: "./app < ./user_code/input.txt"
        },
        c: {
            image: "code-executor-c",
            fileName: `temp.c`,
            dockerfilePath: "./executors/c",
            imagePath: "./executors/c",
            inputpath: "./user_code",
            command: "./app < ./user_code/input.txt"
        },
        java: {
            image: "code-executor-java",
            fileName: `Main.java`,
            dockerfilePath: "./executors/java",
            imagePath: "./executors/java",
            inputpath: "./user_code",
            command: "java Main < ./user_code/input.txt"
        }
    };

    const config = languageConfigs[language];
    if (!config) throw new Error("Unsupported language");

    // Write the code to a temporary file in the language's folder
    const tempFilePath = path.join(config.dockerfilePath, config.fileName);
    fs.writeFileSync(tempFilePath, code);

    let inputFilePath;
    if (language != 'cpp' && language != 'c' && language != 'java'){
        inputFilePath = path.join(config.dockerfilePath, "input.txt");
        fs.writeFileSync(inputFilePath, stdin);
    }
    else{
        inputFilePath = path.join(config.inputpath, "input.txt");
        fs.writeFileSync(inputFilePath, stdin);
    }

    const timeoutMs = 30000; // Set a timeout of 5 seconds
    return new Promise((resolve, reject) => {
        const userCodePath = path.resolve("./user_code");

        if(language != 'cpp' && language != 'c' && language != 'java'){

            const process = exec(`docker run --memory="256m" --cpus="0.5" -i -v "${userCodePath}:/usr/src/app" ${config.image} ${config.command}`);

            let output = "";
            let error = "";

            process.stdout.on("data", (data) => (output += data));
            process.stderr.on("data", (data) => (error += data));

            const timeout = setTimeout(() => {
                process.kill(); // Forcefully terminate the process
                reject({ output, error: "Execution timed out" });
            }, timeoutMs);

            process.on("close", (code) => {
                clearTimeout(timeout);
                fs.unlinkSync(tempFilePath);
                
                if (code === 0) {
                    resolve({ output, error });
                } else {
                    reject({ output, error });
                }
            });
        } 
        // cpp logic here
        else{
            const buildCommand = `docker build -t ${config.image} ${config.imagePath}`;
            const buildProcess = exec(buildCommand);

            let buildOutput = "";
            let buildError = "";

            buildProcess.stdout.on("data", (data) => (buildOutput += data));
            buildProcess.stderr.on("data", (data) => (buildError += data));

            buildProcess.on("close", (buildCode) => {
                if (buildCode !== 0) {
                    reject({ output: buildOutput, error: buildError });
                    return;
                }

                // After the image is built, run the Docker container
                const runCommand = `docker run --memory="256m" --cpus="0.5" -i ${config.image} ${config.command}`;
                const runProcess = exec(runCommand);

                let output = "";
                let error = "";

                runProcess.stdout.on("data", (data) => (output += data));
                runProcess.stderr.on("data", (data) => (error += data));

                const timeout = setTimeout(() => {
                    runProcess.kill(); // Forcefully terminate the process
                    reject({ output, error: "Execution timed out" });
                }, timeoutMs);

                runProcess.on("close", (runCode) => {
                    clearTimeout(timeout);
                    // Clean up temporary files
                    fs.unlinkSync(tempFilePath);
                
                    if (runCode === 0) {
                        resolve({ output, error });
                    } else {
                        reject({ output, error });
                    }
                });
            });
        }
    });
}
