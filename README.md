## First Run

** IMPORTANT! CHECK NODE AND NPM VERSION! **
The monorepo need a npm version 9+

1. Initialize the env! Run `npm run setup:<unix | windows>`, based on your OS. This will:\
   a. Install all the necessaries packages\
   b. Compile the constantsjs library\
   c. copy the .env.example to .env

2. Bring up the databases! You can do this with `npm run dbs:start` or directly
   via docker compose, i.e. `docker compose up -d`

3. Get some data in the db! Run the seed command via `npm run seed`

4. Start the project! Run `npm run dev:all` to make the fun begin. This:\
   a. SHOULD start on unix systems all the instances\
   b. alternatively from the main directory\
    i. npm run dev:auth\
    i. npm run dev:users\
    i. npm run dev:roles\
    i. npm run dev:frontend

### Migrating from old "standalone" docker container:

When moving to the `docker compose` approach, the "old" mongodb containers will _not_ share their data
with the new ones.

Thankfully, moving the data from one container to the other is very easy:

- First, identify the docker container id of your current mongodb container. This can be done via

  ```
  docker ps
  ```

  with the container running. This will produce an output like this one:

  ```
  CONTAINER ID   IMAGE     COMMAND                  CREATED       STATUS          PORTS                                           NAMES
  d644eadad205   mongo     "docker-entrypoint.s…"   10 days ago   Up 16 minutes   0.0.0.0:27017->27017/tcp, :::27017->27017/tcp   mongodb
  ```

- Second, move to a **safe** folder, something like `/var/tmp/`, and create and access a folder for the dumping operations.
  Something like this:

  ```
  cd /var/tmp/
  mkdir mongodump
  cd mongodump
  ```

- Third, let's backup mongo data! This can be done with the following commands:

  ```
  docker exec -i <CONTAINER_ID> /usr/bin/mongodump --out /dump
  docker cp <CONTAINER_ID>:/dump .
  ```

  This will execute a dump of the mongodb data and copy everything from the running container to the
  current directory.

- Fourth, stop the current container (with `docker stop <CONTAINER_ID>`) and bring up the new one,
  using `docker compose up -d` (the `npm` command will not work outside of the repos' folder)

- Fifth, copy the backed up data in the new container:

  ```
  docker cp ./dump ascos_mongodb:/dump
  docker exec -i ascos_mongodb /usr/bin/mongorestore /dump
  ```

  As you might've noticed, this new operation doesn't require obtaining the container id, since the
  container created with `docker compose` has a given and known name.

You're good to go! Before using the new DB please make sure that the data has been successfully copied.

You can keep or delete the local dump, it's up to you.

## Constants library while working on the backend:

At the moment the nestjs backend cannot use a esnext library. So we have two constants libraries:
- @smambu/lib.constants is the main one, compiled in esnext and used directly by vitejs
- @smambu/lib.constantsjs is a compilation of the first one (it has only an empty file)

The downside is that while working on the backend you need to compile the library (there is a watcher).
Please KEEP ATTENTION that sometimes the watcher crash or stop without any warning. In this cases is better to force a re-compiler

### Github Actions workflow

The repo has a GH Action that creates docker images for each service. The confguration is inside `.github/workflows/docker-publish.yml`

The actions does the following:

- For each PR against `develop` run a docker build to make sure everything is at leaast building properly
- For each push against `develop` run a docker build and push the docker images tagging them with the branch name
- For each tag pushed that has the format `v*.*.*` (e.g. v0.0.1) build and push the docker images tagging them with the tag name

### Possible problems?

A. during npm run seed: unable to connect to database MongooseError: The `uri` parameter to `openUri()` must be a string, got "undefined" -> try change mongodb*uri*_ in MONGODB*URI*_ in seeder.js

- Or copy the .env file in the backend/ascos-\* folder
  B. npm i ascos-auth fails. for now use flag --force or --legacy-peer-deps

C. Flusso permissions

ex: cases

puoi vedere il case se owner è nello scope della tua P:CASES:VIEW, ovvero se: - sei il dottore associato al case - il tuo utente ha un ruolo con P:CASES:VIEW con CASES domain another's user data e l'utente specificato è quel dottore - il tuo utente ha un ruolo con P:CASES:VIEW con CASES domain ALL

- su quali case tizio ha le permission di view?
  - utente1
    - ottengo lo scope {S} della mia P:CASES:VIEW
    - cerco tutti i case con doctorid in ({S})
- su questo case Giovanni ha la view?
  - simile punto precedente ma confronto solo doctorID del caso specificato
- dato un case con doctorID, da chi può essere visto?
  - prendo tutti i ruoli che hanno P:CASES:VIEW {R}
  - prendo tutte le roleassociations con roleID == {R} che hanno userID == doctorID oppure doctorID contenuto in targetUsers oppure il ruolo {R} ha CASES domain ALL

**ignore .env.example inside backend folders and use only .env.example in the root folder and rename it .env**

D. run again npm run seed. if it doesn't work check if you have to change the path in package.json "seed": "node --require dotenv/config dist/src/seeder.js" **added src**
E. It could be necessary to copy the file .env inside each subfolder (ascos-auth, ascos-roles, ascos-users, frontend)

F. and if you have validation error you can use this userSeed

```
      const seedData = [
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@gmail.com',
          password: "123456",
          status: 'VERIFIED_ACTIVE',
          phoneNumber: "123456",
          title: "sig",
          address: {street: "fakeaddr", houseNumber: "4", city: "fakecity", country: "it", postalCode: "123"},
          birthDate: "09/02/1988",
          roleAssociations: []
        },
        {
          firstName: 'Jack',
          lastName: 'Pa',
          email: 'jack@gmail.com',
          password: "123456",
          status: 'VERIFIED_ACTIVE',
          phoneNumber: "123456",
          title: "sig",
          address: {street: "fakeaddr", houseNumber: "4", city: "fakecity", country: "it", postalCode: "123"},
          birthDate: "09/02/1988",
          roleAssociations: [],
        },
      ];
```

## Dockerized solution:

Now it's possible to use Docker Compose to run multiple containers for the Smambu solution, similar to gcloud.

### `package.json` Scripts:

- **docker:dev**: Behaves similarly to `npm run dev:all`.
- **docker:ci**: Creates and starts a container named `playwright` to run the end-to-end tests.
- **docker:localci**: Does not create the `playwright` container but sets `VITE_APP_ENV = 'ci'`, allowing local use of `playwright` and skipping certain features (e.g., creating verified active users without email).

### Scenarios:

- **Developing a new feature or fixing a bug**: Use `npm run docker:dev`.
- **Developing tests with playwright or skipping features (e.g., SendGrid) (skipping features is discouraged)**: Use `npm run docker:localci`.
- **Emulating gcloud test pipeline as close as possible**: Use `npm run docker:ci`.
- **Shutting down containers**: Use `npm run docker:down`.

### Switch env:

If developing a new feature (`npm run docker:dev`) and then testing it, use `npm run docker:localci`, no need to shutdown first.

### How It Works:

There are several Docker Compose files:

- `docker-compose-db.yml`: Contains Redis and MongoDB containers.
- `docker-compose-e2e-test.yml`: Contains `playwright` for running e2e tests LOCALLY simulating gcloud.
- `docker-compose-reset-db.yml`: Drops all databases and reinitializes them with a currently hardcoded tenant (should use the one defined in `playwright.env`) #TODO.
- `docker-compose.yml`: Includes one container each for backend, frontend, and an `autoheal` container that uses health checks to restart unhealthy containers.
- `docker-compose-network-override-external-cloudbuild.yml`: Used during gcloud builds to override networks and use the one specified by cloudbuild.

If launching manually, use the `launch_docker.sh` file directly (`launch_docker.sh --help` for assistance), or call Docker Compose directly, ensuring to set the `NODE_ENV` value. Examples:

- - `NODE_ENV=docker docker compose -f docker-compose.yml -f docker-compose-db.yml -f docker-compose-reset-db.yml --env-file .env.docker up`
  - `./launch_docker.sh docker --reset-db`

- - `NODE_ENV=localci docker compose -f docker-compose.yml -f docker-compose-db.yml -f docker-compose-reset-db.yml --env-file .env.localci up`
  - `./launch_docker.sh localci --reset-db`

- - `NODE_ENV=docker docker compose -f docker-compose.yml -f docker-compose-db.yml -f docker-compose-e2e-test.yml --env-file .env.docker up`
  - `./launch_docker.sh ci`

The `NODE_ENV` value is used to locate the corresponding `.env.${NODE_ENV}` file.

### Notes:

Please note that if you use `npm run docker:ci` the frontend targets the backends using Docker addresses (i.e. `ascos-auth`) rather than `localhost` (playwright uses a browser internally within the playwright container). A browser on the host machine cannot reach the backends (e.g., the frontend calls `http://ascos-auth:port/auth/login`, an address resolved by Docker). To work on the host machine, you must manually set this address in your host file to `localhost`, but it is recommended to use `docker:localci` instead. 

### How to connect to a remote gcp bucket from local environment

In order to connect to a remote gcp bucket (e.g. the dev one), these are the steps required:
- Ask and obtain access to the developers shared service account;
- Download the associated json key
- Change the `BUCKET_DRIVER` variable (in the `.env` file) to `gcp`
- Change the `GCP_BUCKET_NAME` variable (in the `.env` file) with the name of the bucket you'll use
- Add a new variable called `GOOLE_APPLICATION_CREDENTIALS` in the `.env` file, whose value should be the
*full* path to the previously downloaded json jey

That is!

*WARNING*: DO NOT commit the json key file, under any circumstance! And also, do not add the `GOOGLE_APPLICATION_CREDENTIALS` to any committed `.env` file

Test
