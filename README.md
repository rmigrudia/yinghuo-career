# 萤火职航 · Yinghuo Career

面向大学生的实习、校招和求职工作台。支持按城市和招聘类型浏览岗位、编辑简历、匹配岗位描述、准备面试和跟进投递。团队成员可在独立工作区通过邀请链接协作。

## 运行完整工作台

需要 Node.js 22 或更新版本。克隆本仓库后，在仓库根目录执行：

```bash
npm ci
npm run dev
```

打开 [本地工作台](http://localhost:3000)。配置 AI 前，将 [环境变量模板](.env.example) 复制为 `.env.local`，并把 `LUJIE_SETTINGS_SECRET` 换成你自己生成的随机值。模型连接在应用的「设置」里配置。

- [Docker 云端部署和团队初始化](deploy/cloud/README.md)
- [静态招聘信息库源码](https://github.com/rmigrudia/yinghuo-career/tree/static-catalog)
- [随附的招聘数据快照](data/campus/current.json)保留公告来源和可公开的投递链接。查看招聘时请以原公告为准。

## 来源和许可证

基于 [录阶 / LuJie CareerKit](https://github.com/Chozzc/Lujie-Careerkit) 改造。在上游工作台的基础上加入城市首页、天蓝与鎏金主题、招聘信息库扩展和团队协作工作区。保留 [上游说明](README.upstream.md)、[英文说明](README.en.md)和[第三方署名](NOTICE)。

源码采用 [Apache License 2.0](LICENSE)。
