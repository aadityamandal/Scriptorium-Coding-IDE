import { useEffect, useState } from 'react'
import Editor from '@monaco-editor/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Image from 'next/image'
import { FaSun, FaMoon } from 'react-icons/fa'
import React from 'react'
import Header from '@/components/Header';


type LanguageId =
  | 'javascript'
  | 'python'
  | 'java'
  | 'c'
  | 'cpp'
  | 'bash'
  | 'haskell'
  | 'julia'
  | 'php'
  | 'swift'

interface Language {
  id: LanguageId
  label: string
}

const languages: Language[] = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'python', label: 'Python' },
  { id: 'java', label: 'Java' },
  { id: 'c', label: 'C' },
  { id: 'cpp', label: 'C++' },
  { id: 'bash', label: 'Bash' },
  { id: 'haskell', label: 'Haskell' },
  { id: 'julia', label: 'Julia' },
  { id: 'php', label: 'PHP' },
  { id: 'swift', label: 'Swift' },
]

const defaultCode: Record<LanguageId, string> = {
  javascript: '// Write your JavaScript code here\nconsole.log("Hello World!");',
  python: '# Write your Python code here\nname = input("Enter your name: ")\nprint(f"Hello, {name}!")',
  java: '// Write your Java code here\n// Please make sure the code is written in the Main class\nimport java.util.Scanner;\n\nclass Main {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n        System.out.print("Enter your name: ");\n        String name = scanner.nextLine();\n        System.out.println("Hello, " + name + "!");\n    }\n}',
  c: '// Write your C code here\n#include <stdio.h>\n\nint main() {\n    char name[50];\n    printf("Enter your name: ");\n    scanf("%s", name);\n    printf("Hello, %s!\\n", name);\n    return 0;\n}',
  cpp: '// Write your C++ code here\n#include <iostream>\n#include <string>\n\nint main() {\n    std::string name;\n    std::cout << "Enter your name: ";\n    std::getline(std::cin, name);\n    std::cout << "Hello, " << name << "!" << std::endl;\n    return 0;\n}',
  bash: '# Write your Bash script here\necho "Hello, World!"',
  haskell: '-- Write your Haskell code here\nmain :: IO ()\nmain = do\n    putStrLn "Enter your name:"\n    name <- getLine\n    putStrLn ("Hello, " ++ name ++ "!")',
  julia: '# Write your Julia code here\nprintln("Enter your name:")\nname = readline()\nprintln("Hello, ", name, "!")',
  php: '<?php\n// Write your PHP code here\necho "Enter your name: ";\n$name = trim(fgets(STDIN));\necho "Hello, " . $name . "!";',
  swift: '// Write your Swift code here\nimport Foundation; \nprint("Hello, World!")',
}

const CodeSandbox = () => {
  const router = useRouter()
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageId>('javascript')
  const [code, setCode] = useState<string>(defaultCode[selectedLanguage])
  const [output, setOutput] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [stdinFields, setStdinFields] = useState<string[]>([''])
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const [view, setView] = useState<'output' | 'error'>('output')
  const [dropdownVisible, setDropdownVisible] = useState(false)
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null)
  const [loggedIn, setLoggedIn] = useState(false)
  const [firstName, setFirstName] = useState<string | null>(null)
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme')
      return savedTheme ? savedTheme === 'dark' : true
    }
    return true
  })
  const [template, setTemplate] = useState<any | null>(null)
  const [isOwner, setIsOwner] = useState<boolean>(false)

  useEffect(() => {
    if (router.query.template) {
      const template = JSON.parse(router.query.template as string)
      setTemplate(template)
      setSelectedLanguage(template.language)
      setCode(template.code)
    }
  }, [router.query])

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (token) {
      setLoggedIn(true)
      const parsedToken = JSON.parse(atob(token.split('.')[1]))
      setFirstName(parsedToken.firstName)
      if (template && parsedToken.userId === template.user.id) {
        setIsOwner(true)
      }
    }
  }, [template])

  const handleLanguageChange = (value: LanguageId) => {
    setSelectedLanguage(value)
    setCode(defaultCode[value])
    setOutput('')
    setError('')
  }

  const handleEditorChange = (value: string | undefined) => {
    setCode(value || '')
  }

  const handleAddInputField = () => {
    setStdinFields([...stdinFields, ''])
  }

  const handleRemoveInputField = (index: number) => {
    setStdinFields(stdinFields.filter((_, i) => i !== index))
  }

  const handleInputFieldChange = (index: number, value: string) => {
    const updatedFields = [...stdinFields]
    updatedFields[index] = value
    setStdinFields(updatedFields)
  }

  const handleRunCode = async () => {
    setIsRunning(true)
    setOutput('')
    setError('')

    const combinedStdin = stdinFields.join('\n')

    try {
      const response = await fetch('http://localhost:3000/api/exec', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: selectedLanguage,
          code,
          stdin: combinedStdin,
        }),
      })

      const result = await response.json()
      setOutput(result.output || '')
      setError(result.error || '')
    } catch (error: any) {
      setError(`Error: ${error.message}`)
    } finally {
      setIsRunning(false)
    }
  }

  const showDropdown = () => {
    if (hoverTimeout) clearTimeout(hoverTimeout)
    setDropdownVisible(true)
  }

  const hideDropdown = () => {
    const timeout = setTimeout(() => setDropdownVisible(false), 300)
    setHoverTimeout(timeout)
  }

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      router.push('/')
    }
  }

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev)
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', !darkMode ? 'dark' : 'light')
    }
  }

  const handleCreateTemplate = () => {
    router.push({
      pathname: '/templates/create',
      query: { code, language: selectedLanguage }
    })
  }

  const handleEditTemplate = () => {
    router.push({
      pathname: `/templates/edit/${template.id}`,
      query: { template: JSON.stringify(template) }
    })
  }

  const handleForkTemplate = () => {
    router.push({
      pathname: '/templates/create',
      query: { templateId: template.id }
    })
  }

  return (
    <div className={darkMode ? 'min-h-screen bg-gray-900 text-white' : 'min-h-screen bg-gray-100 text-gray-900'}>
      {/* Header */}
      <Header
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        showDropdown={showDropdown}
        hideDropdown={hideDropdown}
        dropdownVisible={dropdownVisible}
      />

      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-12rem)]">
          <div className="space-y-4">
            {/* Editor Controls */}
            <div className={`p-4 rounded-lg shadow-md flex items-center justify-between ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value as LanguageId)}
                className={`px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 ${
                  darkMode
                    ? 'bg-gray-800 text-white border-gray-600 focus:ring-blue-300'
                    : 'bg-gray-100 text-gray-800 border-gray-300 focus:ring-blue-500'
                }`}
              >
                {languages.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.label}
                  </option>
                ))}
              </select>

              <div className="flex items-center space-x-4">
                {loggedIn &&
                  (!template ? (
                    <button
                      onClick={handleCreateTemplate}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      Save Template
                    </button>
                  ) : isOwner ? (
                    <button
                      onClick={handleEditTemplate}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Modify Template
                    </button>
                  ) : (
                    <button
                      onClick={handleForkTemplate}
                      className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                    >
                      Fork Template
                    </button>
                  ))}
                <button
                  onClick={handleRunCode}
                  disabled={isRunning}
                  className={`px-6 py-2 rounded-lg ${
                    isRunning ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
                  } text-white`}
                >
                  {isRunning ? 'Running...' : 'Run'}
                </button>
              </div>
            </div>

            <div className={`p-6 rounded-lg shadow-md ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
              <Editor
                height="60vh"
                language={selectedLanguage}
                value={code}
                onChange={handleEditorChange}
                theme={darkMode ? 'vs-dark' : 'vs-light'}
              />
            </div>
          </div>

          <div className="space-y-4">
        {/* Standard Input Fields */}
            <div className={`p-4 rounded-lg shadow-md space-y-4 ${
              darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
            }`}>
              <div className="text-lg font-semibold">Standard Input</div>
              {stdinFields.map((_, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <input
                    type="text"
                    placeholder="Enter input"
                    value={stdinFields[index]}
                    onChange={(e) => handleInputFieldChange(index, e.target.value)}
                    className={`flex-1 px-4 py-2 rounded-lg border ${
                      darkMode
                        ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-400'
                        : 'bg-white text-gray-800 border-gray-300 placeholder-gray-500'
                    }`}
                  />
                  {stdinFields.length > 1 && (
                    <button
                      onClick={() => handleRemoveInputField(index)}
                      className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={handleAddInputField}
                className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
              >
                Add Input Field
              </button>
            </div>

            {/* Output/Error */}
            <div className={`p-4 rounded-lg shadow-md ${
              darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
            }`}>
              <div className="text-lg font-semibold">
                {view === 'output' ? 'Standard Output' : 'Standard Error'}
              </div>
              <div 
                className={darkMode ? "bg-black text-white p-4 mt-2 rounded-md" : "bg-gray-50 p-4 mt-2 rounded-md"} 
                style={{
                  overflowX: 'auto',
                  wordWrap: 'break-word',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {view === 'output' ? (
                  <pre className="text-green-500">
                    {output || 'No output received, please check standard error.'}
                  </pre>
                ) : (
                  <pre className="text-red-600">
                    {error || 'No error received, please check standard output.'}
                  </pre>
                )}
              </div>
              <button
                onClick={() => setView(view === 'output' ? 'error' : 'output')}
                className="mt-4 px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
              >
                View {view === 'output' ? 'Standard Error' : 'Standard Output'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default CodeSandbox