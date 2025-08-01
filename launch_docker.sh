# Define variables for environments
LOCAL_ENV="localci"
CI="ci"
DOCKER="docker"

print_help() {
  echo "Usage: ./launch_docker.sh NODE_ENV [--reset-db] | down | --install"
  echo "  NODE_ENV: specify the environment (${LOCAL_ENV}, ${CI}, or ${DOCKER})"
  echo "  --reset-db: resets the database"
  echo "  down: stops the containers"
  echo "  --install: cleans npm cache, removes node_modules, lib folders, tsconfig.tsbuildinfo files"
  echo "            and package-lock.json, then runs setup:nix in a Docker container"
  echo "  NODE_ENV values ${LOCAL_ENV}, ${CI}, or ${DOCKER} has different consequences:"
  echo "    - ${LOCAL_ENV}: meant for local e2e tests run/write."
  echo "      sets VITE_APP_ENV to 'ci' to skip few functionalities,"
  echo "      like email send and the need to use email to activate the user."
  echo "    - ${CI}: meant for CI/CD pipeline. it creates a container named playwright that runs e2e tests."
  echo "      emulates gcloud test pipeline"
  echo "    - ${DOCKER}: meant for local development. "
  echo "      creates a container for each backend and a frontend container."
  echo "      similar to old npm run dev:all"
  echo
  echo "Examples:"
  echo "  ./launch_docker.sh ${LOCAL_ENV}             # NODE_ENV=${LOCAL_ENV}"
  echo "  ./launch_docker.sh ${LOCAL_ENV} --reset-db  # NODE_ENV=${LOCAL_ENV} and resets database"
  echo "  ./launch_docker.sh ${CI}                    # NODE_ENV=${CI}, --reset-db is implied. CI always resets the database"
  echo "  ./launch_docker.sh ${DOCKER}                # NODE_ENV=${DOCKER}"
  echo "  ./launch_docker.sh ${DOCKER} --reset-db     # NODE_ENV=${DOCKER} and resets database"
  echo "  ./launch_docker.sh down                     # Stops the containers"
  echo "  ./launch_docker.sh --install                # Clean install in Docker container"
}

if [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
  print_help
  exit 0
fi


ARCH=$(uname -m)
if [[ "$ARCH" == "arm64" || "$ARCH" == "aarch64" ]]; then
  export DOCKER_PLATFORM=linux/arm64
elif [[ "$ARCH" == "x86_64" || "$ARCH" == "amd64" ]]; then
  export DOCKER_PLATFORM=linux/amd64
else
  echo "⚠️  Arch not supported/recognized/specified: $ARCH. using default linux/amd64."
  export DOCKER_PLATFORM=linux/amd64
fi

echo "📦 DOCKER_PLATFORM=${DOCKER_PLATFORM}"


if [ "$1" == "--install" ]; then
  npm cache clean --force
  sudo find . -name "lib" -type d -prune -exec rm -rf {} +
  sudo find . -type f -name "tsconfig.tsbuildinfo" -exec rm -f {} +
  sudo find . -name "node_modules" -type d -prune -exec rm -rf {} +
  rm -rf package-lock.json

    if [ "$(uname -s)" = "Linux" ]; then
      npm run setup:nix
    else
      docker run --platform ${DOCKER_PLATFORM} -it -v "$(pwd)":/root/app -w /root/app --rm node bash -c 'npm run setup:nix'
    fi

  exit 0
fi

if [ -z "$1" ]; then
  echo "Error: NODE_ENV or 'down' must be specified"
  echo "Use flag -h or --help for more information and examples"
  exit 1
fi

echo "Stopping containers..."
NODE_ENV=$LOCAL_ENV DOCKER_PLATFORM=$DOCKER_PLATFORM docker compose -f docker-compose.yml -f docker-compose-db.yml -f docker-compose-e2e-test.yml -f docker-compose-reset-db.yml down

if [ "$1" == "down" ]; then
  exit 0
fi

ALLOWED_ENVS=("${LOCAL_ENV}" "${CI}" "${DOCKER}")  # Aggiunta di "${DOCKER}" agli ambienti consentiti

NODE_ENV=$1
RESET_DB=false

if [[ ! " ${ALLOWED_ENVS[@]} " =~ " ${NODE_ENV} " ]]; then
  echo "Error: NODE_ENV must be one of \"${ALLOWED_ENVS[@]// /|}\"."
  exit 1
fi

if [ "$2" == "--reset-db" ] || [ "$NODE_ENV" == "${CI}" ]; then
  RESET_DB=true
fi

echo "NODE_ENV ${NODE_ENV}."
if [ "$RESET_DB" == true ]; then
  echo "Reset DB flag is set."
fi


COMPOSE_FILES="-f docker-compose.yml -f docker-compose-db.yml"

if [ "$NODE_ENV" == "${CI}" ]; then
  COMPOSE_FILES="${COMPOSE_FILES} -f docker-compose-e2e-test.yml"
fi

if [ "$RESET_DB" == true ]; then
  COMPOSE_FILES="${COMPOSE_FILES} -f docker-compose-reset-db.yml"
fi

NODE_ENV=$NODE_ENV DOCKER_PLATFORM=$DOCKER_PLATFORM docker compose $COMPOSE_FILES --env-file .env.${NODE_ENV} up
