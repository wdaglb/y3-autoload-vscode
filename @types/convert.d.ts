declare interface Convert {
    config: ConfigItem;
    
    /**
     * 添加文件
     */
    addFile(fileName: string): void;

    /**
     * 序列化
     */
    toString(): string;
}
