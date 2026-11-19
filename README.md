# 萤火职航 · Sites

Cloud recruitment catalog. This build uses the city landing page, recruitment catalog, and public recruitment snapshot from the Yinghuo Career workspace. It serves city links, job filters, and company application links with client-side filtering. The character opens catalog shortcuts.

`npm ci` and `npm run build` generate the static deployment in `dist/`. `npm run preview` serves that build for local review. The build places a separate HTML entry at `/campus/` for direct navigation.

The cloud source contains recruiting information only. Resume, application, AI settings, and chat history are managed by the separate local workbench. Refresh the public snapshot by updating `public/data/campus.json` and redeploying. Preserve links and source attribution in the catalog when replacing the snapshot.

The workspace is based on [Lujie CareerKit](https://github.com/Chozzc/Lujie-Careerkit). See [LICENSE](LICENSE) for the upstream license.

[Return to the full workbench source](https://github.com/rmigrudia/yinghuo-career/tree/main).
