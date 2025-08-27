# Malody 到 Phigros 谱面转换器
这是一个将 Malody 谱面转换为 Phigros 格式的网页工具。
网页版url：https://neve0616.github.io/tools/Convert_chart/
## 功能特点

- 支持将 Malody 的 **.mc** 谱面文件转换为 RPE 的 **.json**格式
- 实时预览谱面信息
- 一键生成并下载 Phigros 自制谱面包

## 技术栈


```javascript
JSZip 库 - 用于打包文件
FileSaver 库 - 用于文件下载
```


### 使用方法

1. 上传 Malody 谱面文件 (.mc)
2. 上传音乐文件 (.mp3/.ogg)
3. 上传图片文件 (.jpg/.png)
4. 调整转换设置
5. 点击"生成 Phigros 谱面"按钮
6. 下载生成的谱面包 (.zip)

### 参考文献

1. Malody Key模式 谱面文件解析(https://www.bilibili.com/opus/960569190967672851)
2. UI设计参考
（https://github.com/IambicCave/Malody-to-Phigros-Chart-Converter）

### 表格示例

| 功能 | 状态 | 说明 |
|------|------|------|
| 流速调节 | ✅ | 已完成 |
| 判断线调节 | ✅ | 已完成 |
| 轨道设置 | ✅ | 已完成 |
| LUCK (随机轨道) | ✅ | 已完成|
| FLIP (镜像) | ✅ | 已完成 |
| 谱面倍数 | ✅ | 已完成 |
| phira_yml生成 | ✅ | 已完成 |

****
