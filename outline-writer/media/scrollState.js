const vscode = acquireVsCodeApi();

const previousState = vscode.getState();
let scrollY = previousState ? previousState.scrollY : 0;
window.scroll({ top: scrollY });

document.addEventListener('scroll', () => {
    vscode.setState({ scrollY: window.scrollY });
});
