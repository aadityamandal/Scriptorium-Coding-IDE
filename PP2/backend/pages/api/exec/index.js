import executeCode from "../../../executors/executor"; // Assuming executeCode is in the same directory
import Cors from 'cors';

// Initialize CORS middleware
const cors = Cors({
  methods: ['POST'], // Restrict to POST requests
  origin: '*',       // Allow requests from any origin (you can specify specific domains if needed)
});

// Middleware to run CORS
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export default async function handler(req, res) {

  await runMiddleware(req, res, cors); 
  // Ensure only POST requests are handled
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const { language, code, stdin } = req.body;

  // Check for missing parameters
  if (!language || !code) {
    return res.status(400).json({ error: "Missing required fields: 'language' and 'code'." });
  }

  // Define supported languages
  const supportedLanguages = [
    'python', 'javascript', 'php', 'swift', 'bash',
    'julia', 'haskell', 'c', 'cpp', 'java'
  ];

  // Validate the language
  if (!supportedLanguages.includes(language.toLowerCase())) {
    return res.status(400).json({
      error: `Unsupported language. Supported languages are: ${supportedLanguages.join(', ')}.`
    });
  }

  try {
    // Execute the code
    const { output, error } = await executeCode(language, code, stdin);
    return res.status(200).json({ output, error });
  } catch (err) {
    console.log(err)
    // Handle errors from executeCode or other unexpected issues
    return res.status(500).json({ error: err.error || 'Execution Error: Memory Error or another error occured', details: err });
  }
}


// import { spawn } from 'child_process'; // Import 'spawn' for executing shell commands
// import { writeFileSync, unlinkSync } from 'fs'; // Import 'fs' for handling all file tasks

// export default async function handler(req, res) {
//   // Check if the request method is POST, as this endpoint only supports POST
//   if (req.method !== 'POST') {
//     return res.status(405).json({ error: "Method not allowed" });
//   }
//   // Extract 'code', 'language', and 'stdin' (optional input) from the request body
//   const { code, language, stdin } = req.body;

//   // Validate that 'code' and 'language' are provided; return error if missing
//   if (!code || !language) {
//     return res.status(400).json({ error: "Code and language are required" });
//   }

//   // Configuration for different programming languages supported for PP1
//   const langConfig = {
//     python: {
//       cmd: 'python3', // Command to run Python code
//       args: ['-c', code] // Inline code execution with the '-c' flag
//     },
//     javascript: {
//       cmd: 'node', // Command to run JavaScript code with Node.js
//       args: ['-e', code] // Inline code execution with the '-e' flag
//     },
//     c: {
//       compileCmd: 'gcc', // Compiler command for C
//       compileArgs: ['temp.c', '-o', 'temp.out'], // Arguments for compiling C code
//       execCmd: './temp.out', // Executable file after compilation
//       fileExt: '.c' // File extension for C code
//     },
//     cpp: {
//       compileCmd: 'g++', // Compiler command for C++
//       compileArgs: ['temp.cpp', '-o', 'temp.out'], // Arguments for compiling C++ code
//       execCmd: './temp.out', // Executable file after compilation
//       fileExt: '.cpp' // File extension for C++ code
//     },
//     java: {
//       compileCmd: 'javac', // Compiler command for Java
//       compileArgs: ['Main.java'], // arguments compiling java code
//       execCmd: 'java', // Command to run compiled Java class
//       execArgs: ['Main'], // Arguments for Java execution, specifying the Main class
//       fileExt: '.java', // File extension for Java code
//       fileName: 'Main.java' // Specific filename for Java main class
//     }
//   };

//   // Get language configuration based on 'language' input (e.g., python, javascript, etc.)
//   const config = langConfig[language.toLowerCase()];

//   // If language is unsupported, return an error
//   if (!config) {
//     return res.status(400).json({ error: "Unsupported language" });
//   }

//   try {
//     // Handle compiled languages (C, C++, Java)
//     if (['c', 'cpp', 'java'].includes(language.toLowerCase())) {
//       const filename = config.fileName || `temp${config.fileExt}`; // Define filename
//       writeFileSync(filename, code); // write to a temp file

//       // Compile the code
//       const compileProcess = spawn(config.compileCmd, config.compileArgs);

//       let compileError = '';
//       compileProcess.stderr.on('data', (data) => {
//         compileError += data.toString(); // Capture compilation errors
//       });

//       compileProcess.on('close', (code) => {
//         unlinkSync(filename); // Remove the source file after compilation

//         if (code !== 0) {
//           // If compilation fails, return error
//           return res.status(400).json({ error: compileError || "Compilation error" });
//         }

//         // Execute the compiled binary or Java class
//         const execArgs = config.execArgs || [];
//         const runProcess = spawn(config.execCmd, execArgs);

//         let output = '';
//         let errorOutput = '';

//         // Write to standard input if 'stdin' is provided
//         if (stdin) {
//           runProcess.stdin.write(stdin);
//         }
//         runProcess.stdin.end();

//         // Capture output and errors during execution
//         runProcess.stdout.on('data', (data) => {
//           output += data.toString();
//         });

//         runProcess.stderr.on('data', (data) => {
//           errorOutput += data.toString();
//         });

//         // When the execution process finishes
//         runProcess.on('close', (code) => {
//           if (config.execCmd === './temp.out') {
//             unlinkSync('temp.out'); // Clean up the compiled binary
//           } else if (config.execCmd === 'java') {
//             unlinkSync('Main.class'); // Clean up the Java class file
//           }

//           return res.status(200).json({
//             stdout: output,
//             stderr: errorOutput,
//             success: code === 0
//           });
//         });
//       });
//     } else {
//       // For interpreted languages (Python, JavaScript)
//       const process = spawn(config.cmd, config.args);

//       let output = '';
//       let errorOutput = '';

//       // Write to standard input if 'stdin' is provided
//       if (stdin) {
//         process.stdin.write(stdin);
//       }
//       process.stdin.end();

//       // Capture output and errors during execution
//       process.stdout.on('data', (data) => {
//         output += data.toString();
//       });

//       process.stderr.on('data', (data) => {
//         errorOutput += data.toString();
//       });

//       // When the interpreted process finishes
//       process.on('close', (code) => {
//         return res.status(200).json({
//           stdout: output,
//           stderr: errorOutput,
//           success: code === 0
//         });
//       });
//     }
//   } catch (err) {
//     // If any unexpected error occurs, return a 500 error
//     return res.status(500).json({ error: "Execution failed" });
//   }
// }
