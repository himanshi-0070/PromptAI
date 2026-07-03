# Release Notes: PromptAI v1.0.0

🎉 **PromptAI Version 1.0 is officially released!** 🎉

This is our first production-ready milestone, marking the transition from an experimental generative AI sandbox to a robust, fully-featured AI Software Engineering Platform.

### 🌟 What's New?
* **Google Gemini 2.5 Integration**: Harness the extreme speed and contextual reasoning of Google's flagship multimodal LLM to write, refactor, and review entire React ecosystems instantly.
* **Intelligent File Scaffolding**: No more copy-pasting single files. PromptAI generates complex hierarchical project architectures, resolving dependencies and package scaffolding effortlessly.
* **Invisible Version Control**: Your projects are automatically backed by a local Git engine. Every time you ask PromptAI to make an edit, a seamless Git commit is generated, enabling robust visual diffs and instant one-click rollbacks.
* **Sandboxed Previews**: WebContainer API powers our live browser previews. See your Node processes compile and execute securely within the browser, isolated from host OS vulnerabilities.
* **Dual-Tier Authentication**: Google OAuth provides secure authentication mechanisms preserving ownership scopes across private project repositories.

### 🔧 Stability Improvements
* Overhauled React Lifecycle rendering to minimize phantom UI repaints.
* Bolstered Express Server infrastructure with IP Rate Limiting, HTTP Helmet security policies, and GZIP compression optimizations.
* Eradicated all `unused-var` and `exhaustive-deps` linting bugs, paving the way for pristine Vite CI/CD pipeline deployments.

**Upgrade Instructions**
To run the latest V1 release locally:
1. `git pull` the master branch.
2. Ensure you have Node `v18.0.0+` installed.
3. Review `DEPLOYMENT.md` for environmental keys setup.
4. Run `npm install` and `npm run dev`.

Thank you for building with PromptAI! 🚀
