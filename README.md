# y3-autoload-vscode


## 快速入门

可以让你的y3项目，支持自动加载，新增或删除文件时不需要去自己require

安装后在项目根目录新增`.autoload.json`，重新启动vscode即可

```
{
  "scans": [
    {
      "scan_path": "app/",
      "output_file": "app/autoload.lua",
      "export": false,
      "include": [
        "**/*.lua"
      ],
      "exclude": [
        "**/初始化.lua"
      ],
      "top": [
        "core/**.lua"
      ]
    }
  ]
}
```

参数说明：
scan_path是要自动加载的目录，相对于项目
output_file为输出的文件，会被覆盖（不要用已经存在的文件）
export是否需要return加载进来的文件
include匹配格式，支持*模糊匹配
exclude过滤格式，支持*模糊匹配
top匹配指定的优先require，支持*模糊匹配

## 手动生成指令

ctrl+shift+p
输入指令：`y3-autoload`

@by qq：1207877378
