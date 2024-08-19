import { minimatch } from 'minimatch';
import path from 'path';
import * as vscode from 'vscode';

export default class LuaConvert implements Convert {
    private list: string[] = [];

    constructor(public config: ConfigItem) {
    }

    /**
     * 添加文件
     */
    addFile(file: string) {
        let name = file.replace(/\//g, '.').trim();
        name = name.replace(/^\.+|\.lua$/g, '');
        this.list.push(name);
    }

    toString(): string {
        const modules: string[] = [];
        const list = this.list.map(name => {
            const requireName = `require('${name}')`;
            if (!this.config.export) {
                return requireName;
            }
            const modName = this.getModName(name);
            modules.push(modName);
            return `local ${modName} = ${requireName}`;
        });
        if (!this.config.export) {
            return list.join("\r\n");
        }
        list.push("return {");
        modules.forEach(mod => {
            list.push(`  ${mod},`);
        });
        list.push("}");

        return list.join("\r\n");
    }

    private getModName(name: string): string {
        return name.replace(/\./g, '_');
    }

}
