#!/bin/sh

echo "DEBUG ENV: ${TRAVIS_JOB_NUMBER} ${TRAVIS_BUILD_NUMBER} ..."

if [ "${TRAVIS_BUILD_NUMBER}.2" != "${TRAVIS_JOB_NUMBER}" ]; then
  echo "Only run sauce labs 1 time... quit."
  exit 0
fi

# build JS files for dist and test
npm install grunt grunt-cli grunt-contrib-connect grunt-saucelabs

npm run-script lint
npm run-script build_std
npm run-script build_dbg
npm run-script build_min
npm run-script build_req
npm run-script build_tst

# do sauce labs tests
node_modules/.bin/grunt || exit $?

# Setup git
git config --global user.name "Travis-CI"
git config --global user.email "zordius@yahoo-inc.com"

git add dist
git commit -m "Auto build dist files for ${TRAVIS_COMMIT} [ci skip]"

# push back dist files
git push "https://${GHTK}@github.com/zordius/json-path-processor.git" HEAD:${TRAVIS_BRANCH} > /dev/null 2>&1

CODEDIFF=`git diff --name-only ${TRAVIS_COMMIT} |grep json-path-processor.js`

if [ -z "$CODEDIFF" ]; then
  echo json-path-proceccor.js is not changed, SKIP deploy.
  exit 0
fi

# Mark this build to deploy
PUSH_NPM=1
export PUSH_NPM

# Bump npm version and push back to git
npm version prerelease -m "Auto commit for npm publish version %s [ci skip]"
git push "https://${GHTK}@github.com/zordius/json-path-processor.git" --tags > /dev/null 2>&1
