# How to run things

npm install -> Install root dependencies
cd app
npm install -> Install app router dependencies
cd ..
cds bind --exec -- npm.cmd start --prefix app -> Start App router
cds watch --profile hybrid -> Start CAP app

=> Update and run requests in http authTest.http


# Getting Started

Welcome to your new project.

It contains these folders and files, following our recommended project layout:

File or Folder | Purpose
---------|----------
`srv/` | your service models and code go here
`package.json` | project metadata and configuration
`readme.md` | this getting started guide


## Next Steps

- Open a new terminal and run `cds watch` 
- (in VS Code simply choose _**Terminal** > Run Task > cds watch_)
- Start adding content, for example, a [db/schema.cds](db/schema.cds).


## Learn More

Learn more at https://cap.cloud.sap/docs/get-started/.
