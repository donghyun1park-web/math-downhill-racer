# GitHub Pages Deploy

This project is a static Phaser 3 PWA. It does not need a build step. GitHub Pages can deploy the repository root directly.

## Repository Structure

Required runtime files live at the repository root:

```text
index.html
manifest.webmanifest
sw.js
src/
assets/
vendor/phaser.min.js
.nojekyll
.github/workflows/deploy-pages.yml
```

The app uses relative paths such as `./src/main.js`, `./manifest.webmanifest`, and `./sw.js`, so it works as a GitHub Pages project site:

```text
https://<github-user>.github.io/<repository-name>/
```

## One-Time GitHub Setup

1. Create a GitHub repository.
2. Upload or push this project folder to the repository root.
3. In GitHub, open `Settings -> Pages`.
4. Set `Source` to `GitHub Actions`.
5. Push to the `main` branch.
6. Wait for the `Deploy GitHub Pages` workflow to complete.
7. Open the Pages URL shown in the workflow summary.

## Local Git Commands

Run these from this folder after creating the GitHub repository:

```bash
git init
git add .
git commit -m "Prepare Phaser PWA for GitHub Pages"
git branch -M main
git remote add origin https://github.com/<github-user>/<repository-name>.git
git push -u origin main
```

Replace `<github-user>` and `<repository-name>` with the real values.

## PWA Notes

- GitHub Pages serves over HTTPS, so the service worker can register.
- `sw.js` is at the project root and registers with `./sw.js`, matching the project site path.
- `manifest.webmanifest` uses relative icon paths.
- `.nojekyll` prevents GitHub Pages from treating files or folders as Jekyll content.

## QA URLs

After deployment:

```text
https://<github-user>.github.io/<repository-name>/
https://<github-user>.github.io/<repository-name>/?debugTouch=1
https://<github-user>.github.io/<repository-name>/?debugPerf=1
https://<github-user>.github.io/<repository-name>/?debugStorage=1
```

## Real Device Checks

- Open the Pages URL on Android Chrome.
- Install or add to home screen if offered.
- Open the Pages URL on iPhone Safari.
- Use Share -> Add to Home Screen.
- Test offline relaunch after visiting once online.
- If a stale version appears, reload once online and confirm `sw.js` cache version was bumped.
