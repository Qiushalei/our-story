# 我们的故事 · 情侣纪念网页

## 功能

- 🔒 访问密码保护（密码：040121）
- ✏️ 可编辑情侣名字
- 🌸 记录相识日期及相识天数
- 📅 大事件时间线
- 💝 纪念日倒计时（精确到秒）
- 🏔️ 自然风光背景轮播（山脉、草甸、峡湾）
- 🎵 背景音乐
- 📸 共享相册（支持手机上传）

## 部署到 GitHub Pages

### 步骤一：创建仓库

1. 登录 [github.com](https://github.com)
2. 点击右上角 **+** → **New repository**
3. 仓库名称建议：`our-story`（或任意名称）
4. 选择 **Public**（GitHub Pages 免费版需公开）
5. 点击 **Create repository**

### 步骤二：上传文件

在仓库页面点击 **uploading an existing file**，将以下文件全部上传：

- `index.html`
- `style.css`
- `script.js`
- `.nojekyll`

### 步骤三：启用 GitHub Pages

1. 进入仓库 → **Settings** → **Pages**
2. Source 选择 **Deploy from a branch**
3. Branch 选择 **main**，文件夹选 **/ (root)**
4. 点击 **Save**

### 步骤四：访问

约 1-2 分钟后，访问地址为：

```
https://你的用户名.github.io/仓库名/
```

例如：`https://zhangsan.github.io/our-story/`

## 数据说明

所有数据（名字、日期、事件、纪念日、照片）均保存在浏览器 **localStorage** 中。
- 不同设备数据独立，需各自输入
- 清除浏览器数据会导致数据丢失，建议定期导出照片
- 照片以 base64 格式存储，上传数量建议不超过 100 张

## 修改背景音乐

编辑 `index.html`，找到 `<source src="...">` 行，替换为你的音乐文件地址。
