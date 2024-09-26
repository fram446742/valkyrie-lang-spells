const vscode = require('vscode');
const { exec } = require('child_process');
const path = require('path');

function activate(context) {
  const languages = ['valkyrie', 'runic']; // Support both languages

  // Register document formatting provider
  languages.forEach(language => {
    let formatProvider = vscode.languages.registerDocumentFormattingEditProvider(language, {
      provideDocumentFormattingEdits(document) {
        const edits = [];
        const { TextEdit, Range } = vscode;
        const fullRange = new Range(
          document.positionAt(0),
          document.positionAt(document.getText().length)
        );
        const formattedText = formatText(document.getText());
        edits.push(TextEdit.replace(fullRange, formattedText));
        return edits;
      },
    });
    context.subscriptions.push(formatProvider);
  });

  // Keywords and their rune equivalents for consistent usage across features
  const keywordMappings = {
    var: { description: 'Variable declaration', rune: '𖤍' },
    fun: { description: 'Function declaration', rune: '♅' },
    if: { description: 'Conditional statement', rune: '↟↟' },
    else: { description: 'Alternative conditional branch', rune: '↟↡' },
    while: { description: 'Loop with condition', rune: '↟↠' },
    for: { description: 'Loop statement', rune: '𒌐' },
    return: { description: 'Return from function', rune: '↡' },
    and: { description: 'Logical and', rune: '↠↠' },
    class: { description: 'Class declaration', rune: '🕈' },
    or: { description: 'Logical or', rune: '↞↞' },
    super: { description: 'Reference to superclass', rune: '🕈↟' },
    this: { description: 'Reference to current instance', rune: '🕈↡' },
  };

  // Register completion provider with expanded examples
  languages.forEach(language => {
    let completionProvider = vscode.languages.registerCompletionItemProvider(
      language,
      {
        provideCompletionItems(document, position, token, context) {
          const completionItems = [];

          // Add basic keyword completions with placeholders for variables
          for (const [keyword, info] of Object.entries(keywordMappings)) {
            const completionItem = new vscode.CompletionItem(keyword, vscode.CompletionItemKind.Keyword);
            completionItem.detail = `Keyword: ${keyword}`;
            completionItem.documentation = `Rune: ${info.rune}`;
            completionItems.push(completionItem);
          }

          // Add more complex completions (based on the examples provided)

          // Variable declaration
          const varCompletion = new vscode.CompletionItem('var', vscode.CompletionItemKind.Snippet);
          varCompletion.insertText = new vscode.SnippetString('var ${1:name} = ${2:value};');
          varCompletion.detail = 'Variable declaration';
          varCompletion.documentation = 'Declare a variable in the format `var <name> = <value>;`';
          completionItems.push(varCompletion);

          // Multiple variable declarations
          const multipleVarCompletion = new vscode.CompletionItem('multiple var', vscode.CompletionItemKind.Snippet);
          multipleVarCompletion.insertText = new vscode.SnippetString('{ var ${1:name1} = ${2:value1}; var ${3:name2} = ${4:value2}; }');
          multipleVarCompletion.detail = 'Multiple variable declarations';
          multipleVarCompletion.documentation = 'Declare multiple variables in a single block';
          completionItems.push(multipleVarCompletion);

          // Print statement
          const printCompletion = new vscode.CompletionItem('print', vscode.CompletionItemKind.Snippet);
          printCompletion.insertText = new vscode.SnippetString('print ${1:variable};');
          printCompletion.detail = 'Print statement';
          printCompletion.documentation = 'Print a variable with the format `print <variable>;`';
          completionItems.push(printCompletion);

          // Class declaration
          const classCompletion = new vscode.CompletionItem('class', vscode.CompletionItemKind.Snippet);
          classCompletion.insertText = new vscode.SnippetString('class ${1:ClassName} {\n\t$2\n}');
          classCompletion.detail = 'Class declaration';
          classCompletion.documentation = 'Define a class in the format `class <Name> { ... }`';
          completionItems.push(classCompletion);

          // Class inheritance
          const inheritanceCompletion = new vscode.CompletionItem('class inheritance', vscode.CompletionItemKind.Snippet);
          inheritanceCompletion.insertText = new vscode.SnippetString('class ${1:ChildClass} < ${2:ParentClass} {\n\t$3\n}');
          inheritanceCompletion.detail = 'Class inheritance';
          inheritanceCompletion.documentation = 'Define a class that inherits from another class';
          completionItems.push(inheritanceCompletion);

          // Method declaration
          const methodCompletion = new vscode.CompletionItem('method', vscode.CompletionItemKind.Snippet);
          methodCompletion.insertText = new vscode.SnippetString('method(${1:param1}, ${2:param2}) {\n\t$3\n}');
          methodCompletion.detail = 'Method declaration';
          methodCompletion.documentation = 'Define a method inside a class';
          completionItems.push(methodCompletion);

          // Constructor declaration
          const constructorCompletion = new vscode.CompletionItem('constructor', vscode.CompletionItemKind.Snippet);
          constructorCompletion.insertText = new vscode.SnippetString('init() {\n\tthis.${1:attribute} = ${2:value};\n}');
          constructorCompletion.detail = 'Constructor method';
          constructorCompletion.documentation = 'Define a constructor with the `init` method';
          completionItems.push(constructorCompletion);

          // Constructor with inheritance
          const superConstructorCompletion = new vscode.CompletionItem('super constructor', vscode.CompletionItemKind.Snippet);
          superConstructorCompletion.insertText = new vscode.SnippetString('class ${1:ChildClass} < ${2:ParentClass} {\n\tinit() {\n\t\tsuper.init();\n\t}\n}');
          superConstructorCompletion.detail = 'Constructor with inheritance';
          superConstructorCompletion.documentation = 'Define a constructor that calls the parent class constructor';
          completionItems.push(superConstructorCompletion);

          // If statement
          const ifCompletion = new vscode.CompletionItem('if', vscode.CompletionItemKind.Snippet);
          ifCompletion.insertText = new vscode.SnippetString('if (${1:condition}) {\n\t$2\n}');
          ifCompletion.detail = 'If statement';
          ifCompletion.documentation = 'Define an if statement';
          completionItems.push(ifCompletion);

          // For loop
          const forCompletion = new vscode.CompletionItem('for', vscode.CompletionItemKind.Snippet);
          forCompletion.insertText = new vscode.SnippetString('for (var ${1:i} = ${2:0}; ${3:i} < ${4:limit}; ${5:i}++) {\n\t$6\n}');
          forCompletion.detail = 'For loop';
          forCompletion.documentation = 'Define a for loop with initialization, condition, and increment';
          completionItems.push(forCompletion);

          // While loop
          const whileCompletion = new vscode.CompletionItem('while', vscode.CompletionItemKind.Snippet);
          whileCompletion.insertText = new vscode.SnippetString('while (${1:condition}) {\n\t$2\n}');
          whileCompletion.detail = 'While loop';
          whileCompletion.documentation = 'Define a while loop';
          completionItems.push(whileCompletion);

          // Function definition
          const funCompletion = new vscode.CompletionItem('fun', vscode.CompletionItemKind.Snippet);
          funCompletion.insertText = new vscode.SnippetString('fun ${1:functionName}(${2:params}) {\n\t$3\n\treturn ${4:null};\n}');
          funCompletion.detail = 'Function definition';
          funCompletion.documentation = 'Define a function in the format `fun <name>(params) { ... }`';
          completionItems.push(funCompletion);

          // Pipe usage
          const pipeCompletion = new vscode.CompletionItem('pipe', vscode.CompletionItemKind.Snippet);
          pipeCompletion.insertText = new vscode.SnippetString('var ${1:variable} = ${2:value} |> ${3:fun};');
          pipeCompletion.detail = 'Pipe usage';
          pipeCompletion.documentation = 'Use pipes to pass dynamic arguments into functions';
          completionItems.push(pipeCompletion);

          return completionItems;
        }
      },
      ' ',  // Trigger completion on space
      '.'   // Trigger completion on '.'
    );

    context.subscriptions.push(completionProvider);
  });

  // Register hover provider
  languages.forEach(language => {
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
          return new vscode.Hover(`**Keyword**: ${word}\n\n**Rune**: ${info.rune}\n\n${info.description}`);
        }

        return null;
      },
    });
    context.subscriptions.push(hoverProvider);
  });


  // Register command to run the interpreter
  let runCommand = vscode.commands.registerCommand('valkyrie-lang-spells.runInterpreter', () => {
    // Get the active text editor
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor detected!');
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
  });

  // Add command to context subscriptions
  context.subscriptions.push(runCommand);
}

// Function to execute the interpreter
function executeInterpreter(filePath) {
  const config = vscode.workspace.getConfiguration('valkyrieLangSpells');
  const interpreterPath = config.get('interpreterPath', '');

  if (!interpreterPath) {
    vscode.window.showErrorMessage('Interpreter path is not set. Please configure it in the extension settings.');
    return;
  }

  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage('No active editor detected!');
    return;
  }

  runInterpreterCommand(interpreterPath, filePath); // Only pass the file path
}

// Function to run the interpreter command
function runInterpreterCommand(interpreterPath, filePath) {
  const command = `"${interpreterPath}" --run_file "${filePath}"`; // Construct the command with the -f flag
  const outputChannel = vscode.window.createOutputChannel('Valkyrie Interpreter Output');

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
    vscode.window.showInformationMessage('Program executed successfully.');
  });
}

// Function to format the text (improved formatting logic)
function formatText(text) {
  const lines = text.split('\n');
  let formattedLines = [];
  let indentLevel = 0;

  lines.forEach((line) => {
    const trimmedLine = line.trim();

    // Adjust indent level when closing braces are encountered
    if (trimmedLine.startsWith('}')) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    // Add indentation based on the current indent level
    formattedLines.push('  '.repeat(indentLevel) + trimmedLine);

    // Increment indent level after opening braces
    if (trimmedLine.endsWith('{')) {
      indentLevel++;
    } else if (trimmedLine.endsWith(';') && !trimmedLine.startsWith('//')) {
      // Ensure statements end with a semicolon
      if (!trimmedLine.endsWith(';')) {
        formattedLines[formattedLines.length - 1] += ';';
      }
    }
  });

  return formattedLines.join('\n');
}


exports.activate = activate;

function deactivate() { }

exports.deactivate = deactivate;
