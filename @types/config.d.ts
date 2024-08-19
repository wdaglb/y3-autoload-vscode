declare interface Config {
    /**
     * 扫描列表
     */
    scans: ConfigItem[];
}

declare interface ConfigItem {
    /**
     * 扫描目录
     */
    scan_path: string;
    /**
     * 输出文件
     */
    output_file: string;
    /**
     * 是否导出
     */
    export?: boolean;
    /**
     * 匹配规则
     */
    include: string[];
    /**
     * 过滤规则
     */
    exclude?: string[];
}
