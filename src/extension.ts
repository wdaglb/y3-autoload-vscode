import path from 'path';
import * as vscode from 'vscode';
import { minimatch } from 'minimatch';
import LuaConvert from './lua';

let watcher: vscode.FileSystemWatcher|undefined = undefined;

/**
 * 文件是否存在
 */
async function checkFileExist(uri: vscode.Uri) {
    try {
        // 尝试获取文件的状态信息
        const fileStat = await vscode.workspace.fs.stat(uri);
        console.log(`File exists: ${uri.fsPath}`);
        return true; // 文件存在
    } catch (error: any) {
        if (error.code === 'FileNotFound') {
            console.log(`File does not exist: ${uri.fsPath}`);
            return false; // 文件不存在
        } else {
            console.error(`Error checking file existence: ${error}`);
            throw error; // 其他错误
        }
    }
}

/**
 * 是否启用
 */
function isEnable() {
	return vscode.workspace.getConfiguration('y3-autoload').get('enable');
}

/**
 * 获取配置文件
 */
async function getConfigFile(dir: vscode.WorkspaceFolder): Promise<Config|undefined> {
	let configFile: string|undefined = vscode.workspace.getConfiguration('y3-autoload').get('configFile');
	if (!configFile) {
		configFile = '.autoload.json';
	}
	const uri = vscode.Uri.file(path.resolve(dir.uri.fsPath, configFile));
	
	if (!await checkFileExist(uri)) {
		vscode.window.showInformationMessage('配置文件' + configFile + '不存在');
		return undefined;
	}
	try {
		const fileContent = await vscode.workspace.fs.readFile(uri);
		const content = Buffer.from(fileContent).toString('utf-8');
		const jsonData = JSON.parse(content);
		return jsonData;
	} catch(error: any) {
		console.error('配置文件加载失败', error);
		vscode.window.showInformationMessage('配置文件' + configFile + '加载失败，' + error.message);
		return undefined;
	}
}

/**
 * 生成自动加载文件
 */
async function generatorAutoLoad() {
	vscode.workspace.workspaceFolders?.forEach(async (dir) => {
		const config = await getConfigFile(dir);
		if (!config) {
			return;
		}

		for (const scanConf of config.scans) {
			await generatorAutoloadFile(dir, scanConf);
		}
	});

}

/**
 * 生成autoload文件
 */
async function generatorAutoloadFile(dir: vscode.WorkspaceFolder, scanConf: ConfigItem) {
	const eqFile = scanConf.output_file.replace(/\\/g, '/');
	const convert = new LuaConvert(scanConf);
	for (const inc of scanConf.include) {
		const scanFile = path.join(scanConf.scan_path, inc);
		const res = await vscode.workspace.findFiles(scanFile);
		// 按文件名排序
		const sortedFiles = res.sort((a, b) => {
			return a.path.localeCompare(b.path);
		});
		
		let list = [];
		for (const r of sortedFiles) {
			const src = r.fsPath.replace(dir.uri.fsPath + path.sep, '').replace(/\\/g, '/');
			let isFilter = false;
			if (eqFile.includes(src)) {
				continue;
			}
			if (scanConf.exclude) {
				for (const ele of scanConf.exclude) {
					if (minimatch(src, scanConf.scan_path + ele)) {
						isFilter = true;
						break;
					}
				}
			}
			if (!isFilter) {
				list.push(src);
			}
		}
		// 置顶指定的规则
		if (scanConf.top) {
			let top: string[] = [];
			list.forEach(file => {
				for (const ele of scanConf.top!) {
					if (minimatch(file, scanConf.scan_path + ele)) {
						top.push(file);
					}
				}
			});
			list = top.concat(list.filter((item) => !top.includes(item)));
		}
		list.forEach(item => {
			convert.addFile(item);
		});
	}
	const saveFile = path.join(dir.uri.fsPath, scanConf.output_file);
	const content = convert.toString();
	const outputFile = vscode.Uri.file(saveFile);
	const encoder = new TextEncoder();
	vscode.workspace.fs.writeFile(outputFile, encoder.encode(content));
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// 启用监听
	const startWatcher = () => {
		const handleUpdateAutoload = () => {
			vscode.commands.executeCommand('y3-autoload');
		};
		watcher = vscode.workspace.createFileSystemWatcher('**/*');
		watcher.onDidCreate(uri => {
			handleUpdateAutoload();
		});
		watcher.onDidDelete(uri => {
			handleUpdateAutoload();
		});
		context.subscriptions.push(watcher);
	};
	vscode.workspace.onDidChangeConfiguration(event => {
		// 是否启用
		if (event.affectsConfiguration('y3-autoload.enable')) {
			if (isEnable()) {
				if (watcher === undefined) {
					startWatcher();
				}
			} else {
				watcher?.dispose();
				watcher = undefined;
			}
		}
		// 配置文件变更
		else if (event.affectsConfiguration('y3-autoload.configFile')) {
			
		}
	});


	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('y3-autoload', generatorAutoLoad);
	startWatcher();

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
