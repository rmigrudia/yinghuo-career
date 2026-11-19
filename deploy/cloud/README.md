# 完整工作台云端部署

这套配置在支持 Docker Compose 的云主机上运行现有 Next.js 工作台。Caddy 提供 HTTPS 和独立于 ChatGPT 的工作台账号。SQLite 保存在持久化卷中。公开招聘站仍可使用已有的 Sites 部署。

此部署用于单人工作台。登录后的用户访问同一个工作区，因此一组密码只交给该工作区的所有者。工作台容器只接受容器网络内的请求。Caddy 在转发前校验整个站点，包括页面、API 和上传。

1. 确保云主机入站 80 和 443 端口可用。可以把域名解析到云主机，也可以用公网 IP 直接部署。公网 IP 部署时，将 `ROXY_WORKSPACE_HOST` 填为公网 IP，并将 `ROXY_WORKSPACE_TLS_MODE` 设置为 `ip`。Caddy 会向 Let's Encrypt 申请并自动更新短期 IP 证书。
2. 在仓库根目录运行 `cp deploy/cloud/settings.env.example deploy/cloud/.env`。填入地址和用户名。运行 `docker run --rm -it caddy:2.11-alpine caddy hash-password`，在提示时输入工作台密码，将得到的 bcrypt 哈希放进 `ROXY_WORKSPACE_PASSWORD_HASH` 的单引号。用 `openssl rand -hex 32` 生成 `LUJIE_SETTINGS_SECRET`。生产运行期间保持此值稳定，用于解密已保存的模型密钥。
3. 运行 `docker compose --env-file deploy/cloud/.env -f deploy/cloud/compose.yml up -d --build`。通过 HTTPS 访问工作台，然后在设置页配置云端要使用的模型服务。

首次启动会创建云端数据库。已有的简历、投递记录和设置需要通过一致性数据库备份单独迁移。模型密钥依赖原加密配置，迁移时可以先清除历史密钥，再从云端设置页重新录入。备份数据库、运行配置和密钥时使用私有存储。

需要公开共享工作台时，在部署配置中设置 `ROXY_WORKSPACE_ACCESS=public`，再用相同的 Compose 项目重新创建网关。访客可直接访问页面并共用一份可编辑的数据库。公开模式下，访客可以阅读 AI 设置页，服务器会拒绝访客保存或测试共享 AI 连接。公开部署请使用专门供共享的工作区和数据库。默认模式是 `private`，由网关验证工作台账号。

团队成员通过 `/team` 登录独立工作区。先用 `openssl rand -hex 24` 生成初始化口令并填入 `ROXY_TEAM_SETUP_TOKEN`，部署后在 `/team?setup=1` 创建管理员账号。创建后可以清空环境文件里的口令，再用相同的 Compose 项目更新工作台容器。管理员在「团队成员」生成单次邀请链接。
