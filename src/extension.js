const vscode = require("vscode");
const { exec } = require("child_process");
const path = require("path");

function activate(context) {
  const languages = ["valkyrie", "runic"]; // Support both languages

  // Register document formatting provider
  languages.forEach((language) => {
    let formatProvider =
      vscode.languages.registerDocumentFormattingEditProvider(language, {
        provideDocumentFormattingEdits(document) {
          const edits = [];
          const { TextEdit, Range } = vscode;
          const fullRange = new Range(
            document.positionAt(0),
            document.positionAt(document.getText().length),
          );
          let formattedText;
          if (language === "valkyrie") {
            formattedText = formatText(document.getText());
          } else if (language === "runic") {
            formattedText = formatTextRunic(document.getText());
          }
          edits.push(TextEdit.replace(fullRange, formattedText));
          return edits;
        },
      });
    context.subscriptions.push(formatProvider);
  });

  // Register rename provider
  languages.forEach((language) => {
    let renameProvider = vscode.languages.registerRenameProvider(language, {
      provideRenameEdits(document, position, newName, token) {
        return provideRenameEdits(document, position, newName, token);
      },
    });
    context.subscriptions.push(renameProvider);
  });

  // Keywords and their rune equivalents for consistent usage across features
  const keywordMappings = {
    var: { description: "Variable declaration", rune: "𖤍" },
    fun: { description: "Function declaration", rune: "♅" },
    print: { description: "Function declaration", rune: "♅♅" },
    if: { description: "Conditional statement", rune: "↟↟" },
    else: { description: "Alternative conditional branch", rune: "↟↡" },
    while: { description: "Loop with condition", rune: "↟↠" },
    for: { description: "Loop statement", rune: "𒌐" },
    return: { description: "Return from function", rune: "↡" },
    and: { description: "Logical and", rune: "↠↠" },
    class: { description: "Class declaration", rune: "🕈" },
    or: { description: "Logical or", rune: "↞↞" },
    super: { description: "Reference to superclass", rune: "🕈↟" },
    this: { description: "Reference to current instance", rune: "🕈↡" },
  };


  const keywordMappingsRunic = {
    var: { description: "Variable declaration", runic: "ᛡᚨᛃ" },
    fun: { description: "Function declaration", runic: "ᚠᚢᚾ" },
    if: { description: "Conditional statement", runic: "ᛁᚠ" },
    else: { description: "Alternative conditional branch", runic: "ᛅᛐᛋᛅ" },
    while: { description: "Loop with condition", runic: "ᚳᚺᛁᛐᛅ" },
    for: { description: "Loop statement", runic: "ᚠᛜᛃ" },
    return: { description: "Return from function", runic: "ᛃᛅᛄᚢᛃᚾ" },
    and: { description: "Logical and", runic: "ᚨᚾᚦ" },
    class: { description: "Class declaration", runic: "ᚲᛐᚨᛋᛋ" },
    or: { description: "Logical or", runic: "ᛜᛃ" },
    super: { description: "Reference to superclass", runic: "ᛋᚢᛩᛅᛃ" },
    this: { description: "Reference to current instance", runic: "ᛄᚺᛁᛋ" },
  };

  const runeMappings = {
    "𖤍": { description: "Variable declaration", keyword: "var" },
    "♅": { description: "Function declaration", keyword: "fun" },
    "♅♅": { description: "Function declaration", keyword: "print" },
    "↟↟": { description: "Conditional statement", keyword: "if" },
    "↟↡": { description: "Alternative conditional branch", keyword: "else" },
    "↟↠": { description: "Loop with condition", keyword: "while" },
    "𒌐": { description: "Loop statement", keyword: "for" },
    "↡": { description: "Return from function", keyword: "return" },
    "↠↠": { description: "Logical and", keyword: "and" },
    "🕈": { description: "Class declaration", keyword: "class" },
    "↞↞": { description: "Logical or", keyword: "or" },
    "🕈↟": { description: "Reference to superclass", keyword: "super" },
    "🕈↡": { description: "Reference to current instance", keyword: "this" },
  };

  const runeMappingsLatin = {
    "ᛡᚨᛃ": { description: "Variable declaration", keyword: "var" },
    "ᚠᚢᚾ": { description: "Function declaration", keyword: "fun" },
    "ᛩᛃᛁᚾᛄ": { description: "Function declaration", keyword: "print" },
    "ᛁᚠ": { description: "Conditional statement", keyword: "if" },
    "ᛅᛐᛋᛅ": { description: "Alternative conditional branch", keyword: "else" },
    "ᚳᚺᛁᛐᛅ": { description: "Loop with condition", keyword: "while" },
    "ᚠᛜᛃ": { description: "Loop statement", keyword: "for" },
    "ᛃᛅᛄᚢᛃᚾ": { description: "Return from function", keyword: "return" },
    "ᚨᚾᚦ": { description: "Logical and", keyword: "and" },
    "ᚲᛐᚨᛋᛋ": { description: "Class declaration", keyword: "class" },
    "ᛜᛃ": { description: "Logical or", keyword: "or" },
    "ᛋᚢᛩᛅᛃ": { description: "Reference to superclass", keyword: "super" },
    "ᛄᚺᛁᛋ": { description: "Reference to current instance", keyword: "this" },
  };

  // Register completion provider with expanded examples
  languages.forEach((language) => {
    let completionProvider = vscode.languages.registerCompletionItemProvider(
      language,
      {
        provideCompletionItems(document, position, token, context) {
          const completionItems = [];

          // Add basic keyword completions with placeholders for variables
          for (const [keyword, info] of Object.entries(keywordMappings)) {
            const completionItem = new vscode.CompletionItem(
              keyword,
              vscode.CompletionItemKind.Keyword,
            );
            completionItem.detail = `Keyword: ${keyword}`;
            completionItem.documentation = `Rune: ${info.rune}`;
            completionItems.push(completionItem);
          }

          for (const [keyword, info] of Object.entries(keywordMappingsRunic)) {
            const completionItem = new vscode.CompletionItem(
              keyword,
              vscode.CompletionItemKind.Keyword,
            );
            completionItem.detail = `Keyword: ${keyword}`;
            completionItem.documentation = `Runic: ${info.rune}`;
            completionItems.push(completionItem);
          }

          // Add rune completions with keyword information
          for (const [rune, info] of Object.entries(runeMappings)) {
            const runeCompletionItem = new vscode.CompletionItem(
              rune,
              vscode.CompletionItemKind.Keyword,
            );
            runeCompletionItem.detail = `Rune: ${rune}`;
            runeCompletionItem.documentation = `Keyword: ${info.keyword}`;
            completionItems.push(runeCompletionItem);
          }

          for (const [runic, info] of Object.entries(runeMappingsLatin)) {
            const runeCompletionItem = new vscode.CompletionItem(
              runic,
              vscode.CompletionItemKind.Keyword,
            );
            runeCompletionItem.detail = `Runic: ${runic}`;
            runeCompletionItem.documentation = `Keyword: ${info.keyword}`;
            completionItems.push(runeCompletionItem);
          }

          // Add more complex completions (based on the examples provided)

          // Variable declaration
          const varCompletion = new vscode.CompletionItem(
            "var",
            vscode.CompletionItemKind.Snippet,
          );
          varCompletion.insertText = new vscode.SnippetString(
            "var ${1:name} = ${2:value};",
          );
          varCompletion.detail = "Variable declaration";
          varCompletion.documentation =
            "Declare a variable in the format `var <name> = <value>;`";
          completionItems.push(varCompletion);

          const runeVarCompletion = new vscode.CompletionItem(
            "varR",
            vscode.CompletionItemKind.Snippet,
          );
          runeVarCompletion.insertText = new vscode.SnippetString(
            "𖤍 ${1:name} = ${2:value};",
          );
          runeVarCompletion.detail = "Rune: Variable declaration";
          runeVarCompletion.documentation =
            "Declare a variable using the rune `𖤍 <name> = <value>;`";
          completionItems.push(runeVarCompletion);

          // Multiple variable declarations
          const multipleVarCompletion = new vscode.CompletionItem(
            "multiple var",
            vscode.CompletionItemKind.Snippet,
          );
          multipleVarCompletion.insertText = new vscode.SnippetString(
            "{ var ${1:name1} = ${2:value1}; var ${3:name2} = ${4:value2}; }",
          );
          multipleVarCompletion.detail = "Multiple variable declarations";
          multipleVarCompletion.documentation =
            "Declare multiple variables in a single block";
          completionItems.push(multipleVarCompletion);

          const multipleruneVarCompletion = new vscode.CompletionItem(
            "multiple varR",
            vscode.CompletionItemKind.Snippet,
          );
          runeVarCompletion.insertText = new vscode.SnippetString(
            "{ 𖤍 ${1:name1} = ${2:value1}; 𖤍 ${3:name2} = ${4:value2}; }",
          );
          runeVarCompletion.detail = "Rune: Variable declaration";
          runeVarCompletion.documentation =
            "Declare a variable using the rune `𖤍 <name> = <value>;`";
          completionItems.push(runeVarCompletion);

          // Print statement
          const printCompletion = new vscode.CompletionItem(
            "print",
            vscode.CompletionItemKind.Snippet,
          );
          printCompletion.insertText = new vscode.SnippetString(
            "print ${1:variable};",
          );
          printCompletion.detail = "Print statement";
          printCompletion.documentation =
            "Print a variable with the format `print <variable>;`";
          completionItems.push(printCompletion);

          const runePrintCompletion = new vscode.CompletionItem(
            "printR",
            vscode.CompletionItemKind.Snippet,
          );
          runePrintCompletion.insertText = new vscode.SnippetString(
            "♅♅ ${1:variable};",
          );
          runePrintCompletion.detail = "Rune: Print statement";
          runePrintCompletion.documentation =
            "Print a variable using the rune `♅♅ <variable>;`";
          completionItems.push(runePrintCompletion);

          // Class declaration
          const classCompletion = new vscode.CompletionItem(
            "class",
            vscode.CompletionItemKind.Snippet,
          );
          classCompletion.insertText = new vscode.SnippetString(
            "class ${1:ClassName} {\n\t$2\n}",
          );
          classCompletion.detail = "Class declaration";
          classCompletion.documentation =
            "Define a class in the format `class <Name> { ... }`";
          completionItems.push(classCompletion);

          const runeClassCompletion = new vscode.CompletionItem(
            "classR",
            vscode.CompletionItemKind.Snippet,
          );
          runeClassCompletion.insertText = new vscode.SnippetString(
            "🕈 ${1:ClassName} {\n\t$2\n}",
          );
          runeClassCompletion.detail = "Rune: Class declaration";
          runeClassCompletion.documentation =
            "Define a class using the rune `🕈 <Name> { ... }`";
          completionItems.push(runeClassCompletion);

          // Class inheritance
          const inheritanceCompletion = new vscode.CompletionItem(
            "class inheritance",
            vscode.CompletionItemKind.Snippet,
          );
          inheritanceCompletion.insertText = new vscode.SnippetString(
            "class ${1:ChildClass} < ${2:ParentClass} {\n\t$3\n}",
          );
          inheritanceCompletion.detail = "Class inheritance";
          inheritanceCompletion.documentation =
            "Define a class that inherits from another class";
          completionItems.push(inheritanceCompletion);

          // Complete rune class inheritance

          // Method declaration
          const methodCompletion = new vscode.CompletionItem(
            "method",
            vscode.CompletionItemKind.Snippet,
          );
          methodCompletion.insertText = new vscode.SnippetString(
            "method(${1:param1}, ${2:param2}) {\n\t$3\n}",
          );
          methodCompletion.detail = "Method declaration";
          methodCompletion.documentation = "Define a method inside a class";
          completionItems.push(methodCompletion);

          // Complete rune method declaration

          // Constructor declaration
          const constructorCompletion = new vscode.CompletionItem(
            "constructor",
            vscode.CompletionItemKind.Snippet,
          );
          constructorCompletion.insertText = new vscode.SnippetString(
            "init() {\n\tthis.${1:attribute} = ${2:value};\n}",
          );
          constructorCompletion.detail = "Constructor method";
          constructorCompletion.documentation =
            "Define a constructor with the `init` method";
          completionItems.push(constructorCompletion);

          // Complete rune constructor declaration

          // Constructor with inheritance
          const superConstructorCompletion = new vscode.CompletionItem(
            "super constructor",
            vscode.CompletionItemKind.Snippet,
          );
          superConstructorCompletion.insertText = new vscode.SnippetString(
            "class ${1:ChildClass} < ${2:ParentClass} {\n\tinit() {\n\t\tsuper.init();\n\t}\n}",
          );
          superConstructorCompletion.detail = "Constructor with inheritance";
          superConstructorCompletion.documentation =
            "Define a constructor that calls the parent class constructor";
          completionItems.push(superConstructorCompletion);

          // Complete rune super constructor

          // If statement
          const ifCompletion = new vscode.CompletionItem(
            "if",
            vscode.CompletionItemKind.Snippet,
          );
          ifCompletion.insertText = new vscode.SnippetString(
            "if (${1:condition}) {\n\t$2\n}",
          );
          ifCompletion.detail = "If statement";
          ifCompletion.documentation = "Define an if statement";
          completionItems.push(ifCompletion);

          const runeIfCompletion = new vscode.CompletionItem(
            "ifR",
            vscode.CompletionItemKind.Snippet,
          );
          runeIfCompletion.insertText = new vscode.SnippetString(
            "↟↟ (${1:condition}) {\n\t$2\n}",
          );
          runeIfCompletion.detail = "Rune: If statement";
          runeIfCompletion.documentation =
            "Define an if statement using the rune";
          completionItems.push(runeIfCompletion);

          // For loop
          const forCompletion = new vscode.CompletionItem(
            "for",
            vscode.CompletionItemKind.Snippet,
          );
          forCompletion.insertText = new vscode.SnippetString(
            "for (var ${1:i} = ${2:0}; ${3:i} < ${4:limit}; ${5:i}++) {\n\t$6\n}",
          );
          forCompletion.detail = "For loop";
          forCompletion.documentation =
            "Define a for loop with initialization, condition, and increment";
          completionItems.push(forCompletion);

          const runeForCompletion = new vscode.CompletionItem(
            "forR",
            vscode.CompletionItemKind.Snippet,
          );
          runeForCompletion.insertText = new vscode.SnippetString(
            "𒌐 (𖤍 ${1:i} = ${2:0}; ${3:i} < ${4:limit}; ${5:i}++) {\n\t$6\n}",
          );
          runeForCompletion.detail = "Rune: For loop";
          runeForCompletion.documentation = "Define a for loop using the rune";
          completionItems.push(runeForCompletion);

          // While loop
          const whileCompletion = new vscode.CompletionItem(
            "while",
            vscode.CompletionItemKind.Snippet,
          );
          whileCompletion.insertText = new vscode.SnippetString(
            "while (${1:condition}) {\n\t$2\n}",
          );
          whileCompletion.detail = "While loop";
          whileCompletion.documentation = "Define a while loop";
          completionItems.push(whileCompletion);

          const runeWhileCompletion = new vscode.CompletionItem(
            "whileR",
            vscode.CompletionItemKind.Snippet,
          );
          runeWhileCompletion.insertText = new vscode.SnippetString(
            "↟↠ (${1:condition}) {\n\t$2\n}",
          );
          runeWhileCompletion.detail = "Rune: While loop";
          runeWhileCompletion.documentation =
            "Define a while loop using the rune";
          completionItems.push(runeWhileCompletion);

          // Function definition
          const funCompletion = new vscode.CompletionItem(
            "fun",
            vscode.CompletionItemKind.Snippet,
          );
          funCompletion.insertText = new vscode.SnippetString(
            "fun ${1:functionName}(${2:params}) {\n\t$3\n\treturn ${4:null};\n}",
          );
          funCompletion.detail = "Function definition";
          funCompletion.documentation =
            "Define a function in the format `fun <name>(params) { ... }`";
          completionItems.push(funCompletion);

          const runeFunCompletion = new vscode.CompletionItem(
            "funR",
            vscode.CompletionItemKind.Snippet,
          );
          runeFunCompletion.insertText = new vscode.SnippetString(
            "♅ ${1:functionName}(${2:params}) {\n\t$3\n\t↡ ${4:null};\n}",
          );
          runeFunCompletion.detail = "Rune: Function definition";
          runeFunCompletion.documentation =
            "Define a function using the rune `♅ <name>(params) { ... }`";
          completionItems.push(runeFunCompletion);

          // Pipe usage
          const pipeCompletion = new vscode.CompletionItem(
            "pipe",
            vscode.CompletionItemKind.Snippet,
          );
          pipeCompletion.insertText = new vscode.SnippetString(
            "var ${1:variable} = ${2:value} |> ${3:fun};",
          );
          pipeCompletion.detail = "Pipe usage";
          pipeCompletion.documentation =
            "Use pipes to pass dynamic arguments into functions";
          completionItems.push(pipeCompletion);

          const runePipeCompletion = new vscode.CompletionItem(
            "pipeR",
            vscode.CompletionItemKind.Snippet,
          );
          runePipeCompletion.insertText = new vscode.SnippetString(
            "𖤍 ${1:variable} = ${2:value} ↟↟ ${3:fun};",
          );
          runePipeCompletion.detail = "Rune: Pipe usage";
          runePipeCompletion.documentation =
            "Use pipes to pass dynamic arguments into functions";
          completionItems.push(runePipeCompletion);

          return completionItems;
        },
      },
      " ", // Trigger completion on space
      ".", // Trigger completion on '.'
    );

    context.subscriptions.push(completionProvider);
  });

  // Register hover provider
  languages.forEach((language) => {
    let hoverProvider = vscode.languages.registerHoverProvider(language, {
      provideHover(document, position, token) {
        const range = document.getWordRangeAtPosition(position);

        // If there's no word at the current position, return null
        if (!range) {
          return null;
        }

        const word = document.getText(range);

        // Log the word for debugging purposes (you can remove this once you test)
        console.log(`Hovering over word: ${word}`);

        // Check if the word is a keyword in the mappings
        const info = keywordMappings[word];
        if (info) {
          return new vscode.Hover(
            `**Keyword**: ${word}\n\n**Rune**: ${info.rune}\n\n${info.description}`,
          );
        }

        const infoRunic = keywordMappingsRunic[word];
        if (infoRunic) {
          return new vscode.Hover(
            `**Keyword**: ${word}\n\n**Runic**: ${infoRunic.runic}\n\n${infoRunic.description}`,
          );
        }

        // Check if the word is a rune in the mappings
        const runeInfo = runeMappings[word];
        if (runeInfo) {
          return new vscode.Hover(
            `**Rune**: ${word}\n\n**Keyword**: ${runeInfo.keyword}\n\n${runeInfo.description}`,
          );
        }
        const runeInfoLatin = runeMappingsLatin[word];
        if (runeInfoLatin) {
          return new vscode.Hover(
            `**Runic**: ${word}\n\n**Keyword**: ${runeInfoLatin.keyword}\n\n${runeInfoLatin.description}`,
          );
        }

        return null;
      },
    });
    context.subscriptions.push(hoverProvider);
  });

  // Register command to run the interpreter
  let runCommand = vscode.commands.registerCommand(
    "valkyrie-lang-spells.runInterpreter",
    () => {
      // Get the active text editor
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("No active editor detected!");
        return;
      }

      const document = editor.document;
      const filePath = document.fileName;

      // Ensure the file is saved before running
      if (document.isDirty) {
        document.save().then(() => {
          executeInterpreter(filePath);
        });
      } else {
        executeInterpreter(filePath);
      }
    },
  );

  // Add command to context subscriptions
  context.subscriptions.push(runCommand);
}

// Function to execute the interpreter
function executeInterpreter(filePath) {
  const config = vscode.workspace.getConfiguration("valkyrieLangSpells");
  const interpreterPath = config.get("interpreterPath", "");

  if (!interpreterPath) {
    vscode.window.showErrorMessage(
      "Interpreter path is not set. Please configure it in the extension settings.",
    );
    return;
  }

  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("No active editor detected!");
    return;
  }

  runInterpreterCommand(interpreterPath, filePath); // Only pass the file path
}

// Function to run the interpreter command
function runInterpreterCommand(interpreterPath, filePath) {
  const command = `"${interpreterPath}" --run_file "${filePath}"`; // Construct the command with the -f flag
  const outputChannel = vscode.window.createOutputChannel(
    "Valkyrie Interpreter Output",
  );

  // Execute the command
  exec(command, (error, stdout, stderr) => {
    outputChannel.clear();
    outputChannel.show();

    if (error) {
      outputChannel.appendLine(`Error: ${error.message}`);
      vscode.window.showErrorMessage(`Execution failed: ${error.message}`);
      return;
    }

    if (stderr) {
      outputChannel.appendLine(`Warning: ${stderr}`);
      vscode.window.showWarningMessage(`Execution warning: ${stderr}`);
    }

    outputChannel.appendLine(stdout);
    vscode.window.showInformationMessage("Program executed successfully.");
  });
}

// Function to format the text
function formatText(text) {
  const lines = text.split("\n");
  let formattedLines = [];
  let indentLevel = 0;
  const indentUnit = "    "; // Four spaces for indentation
  let inMultiLineComment = false;

  const increaseIndent = () => {
    indentLevel++;
  };

  const decreaseIndent = () => {
    indentLevel = Math.max(0, indentLevel - 1);
  };

  const keywordMappings = {
    var: "𖤍", fun: "♅", print: "♅♅", if: "↟↟", else: "↟↡",
    while: "↟↠", for: "𒌐", return: "↡", and: "↠↠",
    class: "🕈", or: "↞↞", super: "🕈↟", this: "🕈↡"
  };


  // Add spaces around braces and normalize spaces
  const addSpaces = (line) => {
    return line
      .replace(/\)\s*\{/g, ") {")
      .replace(/\s*([\(\)\{\}])\s*/g, " $1 ") // Add spaces around parentheses and braces
      .replace(/\s+/g, " ") // Normalize multiple spaces
      .trim(); // Trim leading and trailing spaces
  };

  // Split statements correctly considering 'for' loops
  const splitStatements = (line) => {
    const forLoopMatch = line.match(/(for|𒌐)\s*\(.*?\)\s*\n*\{/);
    if (forLoopMatch) {
      const forLoop = forLoopMatch[0];
      const restOfLine = line.replace(forLoop, "");
      return [
        forLoop,
        ...restOfLine.split(";").map((stmt) => stmt.trim()).filter(Boolean),
      ];
    }
    return line.split(";").map((stmt) => stmt.trim()).filter(Boolean);
  };

  lines.forEach((line) => {
    let trimmedLine = line.trim();

    // Handle multi-line comments
    if (inMultiLineComment) {
      formattedLines.push(indentUnit.repeat(indentLevel) + trimmedLine);
      if (trimmedLine.endsWith("*/")) {
        inMultiLineComment = false;
      }
      return;
    }

    if (trimmedLine.startsWith("/*")) {
      formattedLines.push(indentUnit.repeat(indentLevel) + trimmedLine);
      if (!trimmedLine.endsWith("*/")) {
        inMultiLineComment = true;
      }
      return;
    }

    // Handle single-line comments
    if (trimmedLine.startsWith("//")) {
      formattedLines.push(indentUnit.repeat(indentLevel) + trimmedLine);
      return;
    }

    // Decrease indent for closing braces
    if (trimmedLine.startsWith("}")) {
      decreaseIndent();
    }

    // Split the line into individual statements
    let splitLines = splitStatements(trimmedLine);

    splitLines.forEach((splitLine) => {
      let processedLine = addSpaces(splitLine);

      // Replace runes with keyword mappings
      Object.keys(keywordMappings).forEach((keyword) => {
        const rune = keywordMappings[keyword];
        processedLine = processedLine.replace(new RegExp(`\\b${rune}\\b`, 'g'), keyword);
      });

      // Increase indent after opening brace
      if (processedLine.endsWith("{")) {
        formattedLines.push(indentUnit.repeat(indentLevel) + processedLine);
        increaseIndent();
        return;
      }

      // Decrease indent before closing brace
      if (processedLine === "}") {
        decreaseIndent();
        formattedLines.push(indentUnit.repeat(indentLevel) + processedLine);
        return;
      }

      // Add the processed line with the correct indentation
      formattedLines.push(indentUnit.repeat(indentLevel) + processedLine);

      // Handle brace split cases
      let braceSplitLines = processedLine.split(/(\{|\})/).filter(Boolean);
      if (braceSplitLines.length > 1) {
        braceSplitLines.forEach((braceSplitLine) => {
          if (braceSplitLine === "{") {
            increaseIndent();
          } else if (braceSplitLine === "}") {
            decreaseIndent();
          }
          formattedLines.push(
            indentUnit.repeat(indentLevel) + braceSplitLine.trim()
          );
        });
      }
    });
  });

  // Ensure all lines have proper semicolons, except for control flow statements
  formattedLines = formattedLines.map((line) => {
    if (
      line.trim() === "" ||
      line.trim().startsWith("//") ||
      line.trim().endsWith("}") ||
      line.trim().endsWith("{") ||
      // and the next line or after a space there is a { so it isnt being put when ) { or ) \n {
      (/\)\s*\n*\{/.test(line.trim())) ||
      line.trim().endsWith(";")
    ) {
      return line;
    }
    return line + ";";
  });

  return formattedLines.join("\n");
}

function formatTextRunic(text) {
  const lines = text.split("\n");
  let formattedLines = [];
  let indentLevel = 0;
  const indentUnit = "    "; // Four spaces for indentation
  let inMultiLineComment = false;

  const increaseIndent = () => {
    indentLevel++;
  };

  const decreaseIndent = () => {
    indentLevel = Math.max(0, indentLevel - 1);
  };

  const keywordMappings = {
    var: "𖤍", fun: "♅", print: "♅♅", if: "↟↟", else: "↟↡",
    while: "↟↠", for: "𒌐", return: "↡", and: "↠↠",
    class: "🕈", or: "↞↞", super: "🕈↟", this: "🕈↡"
  };


  // Add spaces around braces and normalize spaces
  const addSpaces = (line) => {
    return line
      .replace(/\)\s*\{/g, ") {")
      .replace(/\s*([\(\)\{\}])\s*/g, " $1 ") // Add spaces around parentheses and braces
      .replace(/\s+/g, " ") // Normalize multiple spaces
      .trim(); // Trim leading and trailing spaces
  };

  // Split statements correctly considering 'for' loops
  const splitStatements = (line) => {
    const forLoopMatch = line.match(/(for|𒌐)\s*\(.*?\)\s*\n*\{/);
    if (forLoopMatch) {
      const forLoop = forLoopMatch[0];
      const restOfLine = line.replace(forLoop, "");
      return [
        forLoop,
        ...restOfLine.split(";").map((stmt) => stmt.trim()).filter(Boolean),
      ];
    }
    return line.split(";").map((stmt) => stmt.trim()).filter(Boolean);
  };

  lines.forEach((line) => {
    let trimmedLine = line.trim();

    // Handle multi-line comments
    if (inMultiLineComment) {
      formattedLines.push(indentUnit.repeat(indentLevel) + trimmedLine);
      if (trimmedLine.endsWith("*/")) {
        inMultiLineComment = false;
      }
      return;
    }

    if (trimmedLine.startsWith("/*")) {
      formattedLines.push(indentUnit.repeat(indentLevel) + trimmedLine);
      if (!trimmedLine.endsWith("*/")) {
        inMultiLineComment = true;
      }
      return;
    }

    // Handle single-line comments
    if (trimmedLine.startsWith("//")) {
      formattedLines.push(indentUnit.repeat(indentLevel) + trimmedLine);
      return;
    }

    // Decrease indent for closing braces
    if (trimmedLine.startsWith("}")) {
      decreaseIndent();
    }

    // Split the line into individual statements
    let splitLines = splitStatements(trimmedLine);

    splitLines.forEach((splitLine) => {
      let processedLine = addSpaces(splitLine);

      // Replace keywords with rune mappings
      Object.keys(keywordMappings).forEach((keyword) => {
        processedLine = processedLine.replace(new RegExp(`\\b${keyword}\\b`, 'g'), keywordMappings[keyword]);
      });

      // Increase indent after opening brace
      if (processedLine.endsWith("{")) {
        formattedLines.push(indentUnit.repeat(indentLevel) + processedLine);
        increaseIndent();
        return;
      }

      // Decrease indent before closing brace
      if (processedLine === "}") {
        decreaseIndent();
        formattedLines.push(indentUnit.repeat(indentLevel) + processedLine);
        return;
      }

      // Add the processed line with the correct indentation
      formattedLines.push(indentUnit.repeat(indentLevel) + processedLine);

      // Handle brace split cases
      let braceSplitLines = processedLine.split(/(\{|\})/).filter(Boolean);
      if (braceSplitLines.length > 1) {
        braceSplitLines.forEach((braceSplitLine) => {
          if (braceSplitLine === "{") {
            increaseIndent();
          } else if (braceSplitLine === "}") {
            decreaseIndent();
          }
          formattedLines.push(
            indentUnit.repeat(indentLevel) + braceSplitLine.trim()
          );
        });
      }
    });
  });

  // Ensure all lines have proper semicolons, except for control flow statements
  formattedLines = formattedLines.map((line) => {
    if (
      line.trim() === "" ||
      line.trim().startsWith("//") ||
      line.trim().endsWith("}") ||
      line.trim().endsWith("{") ||
      // and the next line or after a space there is a { so it isnt being put when ) { or ) \n {
      (/\)\s*\n*\{/.test(line.trim())) ||
      line.trim().endsWith(";")
    ) {
      return line;
    }
    return line + ";";
  });

  return formattedLines.join("\n");
}

exports.activate = activate;

function deactivate() { }

exports.deactivate = deactivate;
