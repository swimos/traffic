cd ui
npm install
npm run compile && npm run bundle
mkdir -p ../server/ui
cp -rf index.html dist ../server/ui/
cp -rf app.html dist ../server/ui/
cd ../server
./gradlew clean run

