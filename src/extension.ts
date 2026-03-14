import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

	// Define a subtle blue background highlight that spans the whole line
    const flashDecorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(100, 150, 255, 0.15)', 
        isWholeLine: true
    });
    
    let disposable = vscode.commands.registerCommand('run-from-comment.execute', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return; // No open text editor
        }

        const document = editor.document;

        const originalPosition = editor.selection.active;
        const currentLine = originalPosition.line;

        let startLine = -1;

		let comment = ''

        // Search backwards from the current line to find a comment
        for (let i = currentLine; i >= 0; i--) {
            const text = document.lineAt(i).text.trim();
            // Checking if the line starts with a python comment hash
            if (text.startsWith('#')) {
                startLine = i;
				comment = text
                break;
            }
        }

        if (startLine === -1) {
            vscode.window.showInformationMessage("No previous comment found above the cursor.");
            return;
        }

        vscode.window.setStatusBarMessage(`Running from: ${comment}`, 3000);

        // Create a new selection from the start of the comment line 
        // to the end of the current cursor line
        const endChar = document.lineAt(currentLine).text.length;
        editor.selection = new vscode.Selection(startLine, 0, currentLine, endChar);

        // Trigger the built-in Jupyter command
        await vscode.commands.executeCommand('jupyter.execSelectionInteractive');

		// Flash the background
        const rangeToHighlight = new vscode.Range(startLine, 0, currentLine, endChar);
        editor.setDecorations(flashDecorationType, [rangeToHighlight]);
        
        setTimeout(() => {
            // Collapse the selection back to the original cursor position
            editor.selection = new vscode.Selection(originalPosition, originalPosition);
            
            // Clear the flash decoration
            editor.setDecorations(flashDecorationType, []);
        }, 200); // 200ms gives Jupyter time to "read" the selection before we undo it

    });

    context.subscriptions.push(disposable);
}