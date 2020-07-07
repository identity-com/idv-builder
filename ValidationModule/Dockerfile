FROM 146055947386.dkr.ecr.us-east-1.amazonaws.com/idvtoolkit/validationmodule:latest

RUN mkdir plugins

COPY package.json yarn.lock* ./plugins/

RUN (cd plugins && yarn --production)

COPY . ./plugins
