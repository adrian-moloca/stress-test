#! Remove all the files not part of the repo in the project
npm cache clean --force
sudo find . -name "lib" -type d -prune -exec rm -rf {} +
sudo find . -name "dist" -type d -prune -exec rm -rf {} +
sudo find . -type f -name "tsconfig.tsbuildinfo" -exec rm -f {} +
sudo find . -name "node_modules" -type d -prune -exec rm -rf {} +
rm package-lock.json
