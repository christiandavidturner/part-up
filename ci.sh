#!/bin/bash

set -eu

# Doing this in two steps so that the script fails if GIT_BRANCH is not set.
git_branch=${GIT_BRANCH}

image_tag=${git_branch#*/}
image_name="partup/partup:${image_tag}"
extended_image_name="partup/partup:${image_tag}.${GIT_COMMIT}"

echo "{\"version\": \"`git describe`\"}" > app/public/VERSION

docker_opts=""

if [ $(docker version -f '{{.Server.Experimental}}') == "true" ]; then
  echo "Docker experimental found, let's squash for smaller image!'"
  docker_opts="${docker_opts} --squash=true"
fi

docker build ${docker_opts} --pull -t ${image_name} .
docker tag ${image_name} ${extended_image_name}

tag=$(git describe --exact-match 2>/dev/null || echo "")
if [ $tag ]; then
  echo "Creating a docker image for tag (version): ${tag}"
  docker tag ${image_name} partup/partup:${tag}
  docker push partup/partup:$tag
fi

docker push ${image_name}
docker push ${extended_image_name}
