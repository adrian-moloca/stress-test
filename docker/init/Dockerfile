FROM mongo

RUN apt-get update && apt-get install -y \
    curl \
    jq

COPY ./dump/mongodb /dump/mongodb
COPY init-script.sh /usr/local/bin/init-script.sh
RUN chmod +x /usr/local/bin/init-script.sh


CMD ["sh", "/usr/local/bin/init-script.sh"]